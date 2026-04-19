import { Request, Response } from 'express';
import User from '../models/User.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { getPagination, getPaginationResult } from '../utils/pagination';
import { buildSearchRegex } from '../utils/regex.utils';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  ApiResponse.success(res, req.user);
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, phone } = req.body;
  // Filtrer les champs undefined pour ne pas écraser des valeurs existantes
  const update = Object.fromEntries(
    Object.entries({ firstName, lastName, phone }).filter(([, v]) => v !== undefined)
  );
  const user = await User.findByIdAndUpdate(req.user!._id, update, { new: true });
  ApiResponse.success(res, user, 'Profil mis à jour');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user!._id).select('+password');
  if (!user) throw ApiError.notFound('Utilisateur non trouvé');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw ApiError.badRequest('Mot de passe actuel incorrect');

  user.password = newPassword;
  await user.save();
  ApiResponse.success(res, null, 'Mot de passe modifié');
});

export const getAddresses = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!._id);
  ApiResponse.success(res, user?.addresses || []);
});

export const addAddress = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!._id);
  if (!user) throw ApiError.notFound('Utilisateur non trouvé');

  if (req.body.isDefault) {
    user.addresses.forEach(a => (a.isDefault = false));
  }
  user.addresses.push(req.body);
  await user.save();
  ApiResponse.created(res, user.addresses, 'Adresse ajoutée');
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!._id);
  if (!user) throw ApiError.notFound('Utilisateur non trouvé');

  const address = (user.addresses as any).id(req.params.id);
  if (!address) throw ApiError.notFound('Adresse non trouvée');

  if (req.body.isDefault) {
    user.addresses.forEach(a => (a.isDefault = false));
  }
  Object.assign(address, req.body);
  await user.save();
  ApiResponse.success(res, user.addresses, 'Adresse mise à jour');
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(req.user!._id, { $pull: { addresses: { _id: req.params.id } } });
  ApiResponse.success(res, null, 'Adresse supprimée');
});

export const updatePreferences = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(
    req.user!._id,
    { preferences: { ...req.user!.preferences, ...req.body } },
    { new: true }
  );
  ApiResponse.success(res, user?.preferences, 'Préférences mises à jour');
});

// Admin
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPagination(req.query);
  const { search, role } = req.query;

  const filter: any = {};
  if (search) {
    filter.$or = [
      { firstName: buildSearchRegex(search as string) },
      { lastName: buildSearchRegex(search as string) },
      { email: buildSearchRegex(search as string) },
    ];
  }
  if (role) filter.role = role;

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  ApiResponse.paginated(res, users, getPaginationResult(total, { page, limit }));
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
  if (!user) throw ApiError.notFound('Utilisateur non trouvé');
  ApiResponse.success(res, user, 'Rôle mis à jour');
});

export const toggleUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Utilisateur non trouvé');
  user.isActive = !user.isActive;
  await user.save();
  ApiResponse.success(res, user, `Compte ${user.isActive ? 'activé' : 'désactivé'}`);
});
