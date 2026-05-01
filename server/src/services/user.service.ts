/**
 * user.service.ts — Couche service pour la gestion des utilisateurs
 *
 * Centralise :
 *   - Profil utilisateur (lecture, modification)
 *   - Gestion des adresses
 *   - Changement de mot de passe
 *   - Statistiques client (commandes, CA, fidélité)
 *   - Administration (rôle, suspension)
 */

import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { getPagination, getPaginationResult } from '../utils/pagination';
import logger from '../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UpdateProfileInput {
  firstName?: string;
  lastName?:  string;
  phone?:     string;
  avatar?:    string;
}

export interface AddressInput {
  label:       string;
  fullName:    string;
  phone:       string;
  street:      string;
  city:        string;
  region?:     string;
  country:     string;
  postalCode?: string;
  isDefault?:  boolean;
}

export interface UserStats {
  totalOrders:    number;
  totalSpent:     number;
  avgOrderValue:  number;
  lastOrderDate:  Date | null;
  favouriteCategory: string | null;
  memberSince:    Date;
}

export interface UserListFilters {
  search?: string;
  role?:   string;
  page?:   number;
  limit?:  number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class UserService {

  // ── Profil ────────────────────────────────────────────────────────────────

  /**
   * Retourne le profil complet d'un utilisateur (sans le mot de passe).
   */
  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId).select('-password -refreshToken').lean();
    if (!user) throw ApiError.notFound('Utilisateur non trouvé');
    return user as unknown as IUser;
  }

  /**
   * Met à jour le profil d'un utilisateur.
   * Les champs email et rôle ne sont pas modifiables ici (routes séparées).
   */
  async updateProfile(userId: string, data: UpdateProfileInput): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true, select: '-password -refreshToken' },
    );
    if (!user) throw ApiError.notFound('Utilisateur non trouvé');
    logger.info('Profil mis à jour', { userId });
    return user;
  }

  /**
   * Modifie le mot de passe après vérification de l'ancien.
   *
   * @param userId      - ID de l'utilisateur
   * @param oldPassword - Mot de passe actuel (pour vérification)
   * @param newPassword - Nouveau mot de passe (min 8 caractères)
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) throw ApiError.notFound('Utilisateur non trouvé');
    if (!user.password) throw ApiError.badRequest('Compte OAuth — mot de passe non disponible');

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) throw ApiError.badRequest('Mot de passe actuel incorrect');

    if (newPassword.length < 8) throw ApiError.badRequest('Le mot de passe doit contenir au moins 8 caractères');

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    logger.info('Mot de passe changé', { userId });
  }

  // ── Adresses ──────────────────────────────────────────────────────────────

  /**
   * Ajoute une adresse au profil utilisateur.
   * Si isDefault = true, les autres adresses sont désactivées comme défaut.
   */
  async addAddress(userId: string, address: AddressInput): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('Utilisateur non trouvé');

    if (!user.addresses) user.addresses = [];
    if (user.addresses.length >= 5) throw ApiError.badRequest('Maximum 5 adresses enregistrées');

    if (address.isDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
    } else if (user.addresses.length === 0) {
      address.isDefault = true; // première adresse = défaut automatique
    }

    user.addresses.push(address as any);
    await user.save();
    return user;
  }

  /**
   * Met à jour une adresse existante.
   */
  async updateAddress(userId: string, addressId: string, data: Partial<AddressInput>): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('Utilisateur non trouvé');

    const address = user.addresses?.find(a => String(a._id) === addressId);
    if (!address) throw ApiError.notFound('Adresse non trouvée');

    if (data.isDefault) {
      user.addresses?.forEach(a => { a.isDefault = false; });
    }

    Object.assign(address, data);
    await user.save();
    return user;
  }

  /**
   * Supprime une adresse. Si c'était l'adresse par défaut, la première restante devient défaut.
   */
  async deleteAddress(userId: string, addressId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('Utilisateur non trouvé');

    const address = user.addresses?.find(a => String(a._id) === addressId);
    if (!address) throw ApiError.notFound('Adresse non trouvée');

    const wasDefault = address.isDefault;
    address.deleteOne?.();

    if (wasDefault && user.addresses?.length) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return user;
  }

  // ── Statistiques client ───────────────────────────────────────────────────

  /**
   * Statistiques d'achat d'un client — utile pour le profil et l'admin.
   */
  async getUserStats(userId: string): Promise<UserStats> {
    const Order = (await import('../models/Order.model')).default;

    const user = await User.findById(userId).select('createdAt').lean();
    if (!user) throw ApiError.notFound('Utilisateur non trouvé');

    const [stats, favouriteCatAgg] = await Promise.all([
      Order.aggregate([
        { $match: { user: user._id, 'payment.status': 'completed' } },
        {
          $group: {
            _id:           null,
            totalOrders:   { $sum: 1 },
            totalSpent:    { $sum: '$pricing.total' },
            avgOrder:      { $avg: '$pricing.total' },
            lastOrderDate: { $max: '$createdAt' },
          },
        },
      ]),
      // Catégorie préférée : produit le plus commandé par catégorie
      Order.aggregate([
        { $match: { user: user._id, 'payment.status': 'completed' } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDoc',
          },
        },
        { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'categories',
            localField: 'productDoc.category',
            foreignField: '_id',
            as: 'categoryDoc',
          },
        },
        { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id:   '$categoryDoc._id',
            name:  { $first: '$categoryDoc.name' },
            count: { $sum: '$items.quantity' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
    ]);

    const s = stats[0] ?? { totalOrders: 0, totalSpent: 0, avgOrder: 0, lastOrderDate: null };

    return {
      totalOrders:        s.totalOrders,
      totalSpent:         s.totalSpent,
      avgOrderValue:      Math.round(s.avgOrder),
      lastOrderDate:      s.lastOrderDate,
      favouriteCategory:  favouriteCatAgg[0]?.name ?? null,
      memberSince:        (user as any).createdAt,
    };
  }

  // ── Administration ────────────────────────────────────────────────────────

  /**
   * Liste paginée des utilisateurs avec filtres (admin).
   */
  async listUsers(filters: UserListFilters) {
    const { page = 1, limit = 20 } = filters;
    const filter: Record<string, unknown> = {};

    if (filters.role) filter.role = filters.role;
    if (filters.search) {
      const re = { $regex: filters.search, $options: 'i' };
      filter.$or = [{ firstName: re }, { lastName: re }, { email: re }];
    }

    const pagination = getPagination({ page, limit });
    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip((pagination.page - 1) * pagination.limit)
        .limit(pagination.limit)
        .lean(),
    ]);

    return { users, pagination: getPaginationResult(total, pagination) };
  }

  /**
   * Change le rôle d'un utilisateur (admin seulement).
   */
  async updateRole(userId: string, role: string, adminId: string): Promise<IUser> {
    if (userId === adminId) throw ApiError.badRequest('Impossible de modifier son propre rôle');

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, select: '-password -refreshToken' },
    );
    if (!user) throw ApiError.notFound('Utilisateur non trouvé');

    logger.info('Rôle utilisateur modifié', { userId, newRole: role, by: adminId });
    return user;
  }

  /**
   * Suspend ou réactive un compte utilisateur.
   */
  async updateStatus(userId: string, isActive: boolean, adminId: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, select: '-password -refreshToken' },
    );
    if (!user) throw ApiError.notFound('Utilisateur non trouvé');

    logger.info('Statut compte modifié', { userId, isActive, by: adminId });
    return user;
  }
}

export const userService = new UserService();
