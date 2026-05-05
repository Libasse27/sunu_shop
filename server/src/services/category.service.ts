/**
 * category.service.ts — Couche service pour la gestion des catégories
 *
 * Centralise :
 *   - Construction de l'arbre hiérarchique (parent → enfants)
 *   - CRUD avec validation des relations parent/enfant
 *   - Comptage des produits par catégorie
 *   - Génération de slug unique
 */

import Category, { ICategory } from '../models/Category.model';
import Product from '../models/Product.model';
import { ApiError } from '../utils/ApiError';
import { createSlug } from '../utils/slugify';
import logger from '../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategoryInput {
  name:         string;
  slug?:        string;
  description?: string;
  image?:       string | { url: string; publicId?: string };
  icon?:        string;
  parent?:      string | null;
  order?:       number;
  isActive?:    boolean;
}

export interface CategoryTreeNode {
  _id:           unknown;
  name:          string;
  slug:          string;
  description?:  string;
  image?:        { url: string; publicId?: string };
  icon?:         string;
  parent:        unknown;
  level:         number;
  order:         number;
  isActive:      boolean;
  isFeatured:    boolean;
  productCount:  number;
  seoTitle?:     string;
  seoDescription?: string;
  children:      CategoryTreeNode[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class CategoryService {

  // ── Lecture ───────────────────────────────────────────────────────────────

  /**
   * Retourne la liste plate des catégories actives (admin ou public).
   *
   * @param activeOnly - Si true, retourne uniquement les catégories actives
   */
  async getAll(activeOnly = true): Promise<ICategory[]> {
    const filter = activeOnly ? { isActive: true } : {};
    return Category.find(filter).sort({ order: 1, name: 1 }).lean() as unknown as ICategory[];
  }

  /**
   * Construit l'arbre hiérarchique complet des catégories.
   * Les catégories racines ont leurs enfants imbriqués.
   *
   * @param activeOnly - Filtrer sur les catégories actives
   */
  async getCategoryTree(activeOnly = true): Promise<CategoryTreeNode[]> {
    const filter = activeOnly ? { isActive: true } : {};
    const all = await Category.find(filter).sort({ order: 1, name: 1 }).lean() as unknown as ICategory[];

    // Compter les produits par catégorie
    const productCounts = await this.getProductCounts();

    const map = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    // Première passe : créer les nœuds
    for (const cat of all) {
      map.set(String(cat._id), {
        ...cat,
        children:     [],
        productCount: productCounts[String(cat._id)] ?? 0,
      });
    }

    // Deuxième passe : construire la hiérarchie
    for (const cat of all) {
      const node = map.get(String(cat._id))!;
      const parentId = cat.parent ? String(cat.parent) : null;

      if (parentId && map.has(parentId)) {
        map.get(parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  /**
   * Retourne une catégorie par son slug.
   */
  async getBySlug(slug: string): Promise<ICategory> {
    const cat = await Category.findOne({ slug, isActive: true }).lean();
    if (!cat) throw ApiError.notFound('Catégorie non trouvée');
    return cat as unknown as ICategory;
  }

  /**
   * Compte le nombre de produits actifs par catégorie.
   * Retourne un objet { categoryId: count }.
   */
  async getProductCounts(): Promise<Record<string, number>> {
    const counts = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const result: Record<string, number> = {};
    counts.forEach(c => { result[String(c._id)] = c.count; });
    return result;
  }

  // ── Création ──────────────────────────────────────────────────────────────

  /**
   * Crée une nouvelle catégorie avec génération automatique du slug.
   * Valide que le parent existe avant de créer un enfant.
   */
  async create(data: CategoryInput): Promise<ICategory> {
    const slug = data.slug ?? (await this.generateUniqueSlug(data.name));

    // Vérifier que le slug n'existe pas déjà
    const existing = await Category.findOne({ slug }).lean();
    if (existing) throw ApiError.conflict(`Le slug "${slug}" est déjà utilisé`);

    // Valider le parent si fourni
    if (data.parent) {
      const parentCat = await Category.findById(data.parent).lean();
      if (!parentCat) throw ApiError.badRequest('Catégorie parente introuvable');
      if ((parentCat as any).parent) throw ApiError.badRequest('Imbrication maximale (2 niveaux) atteinte');
    }

    // Normaliser l'image
    const imageField = this._normalizeImage(data.image);

    const category = await Category.create({
      ...data,
      slug,
      image: imageField,
      level: data.parent ? 1 : 0,
      order: data.order ?? 0,
    });

    logger.info('Catégorie créée', { id: category._id, name: category.name });
    return category;
  }

  // ── Mise à jour ───────────────────────────────────────────────────────────

  /**
   * Met à jour une catégorie.
   * Empêche de définir une catégorie comme son propre parent.
   */
  async update(id: string, data: Partial<CategoryInput>): Promise<ICategory> {
    if (data.parent && data.parent === id) {
      throw ApiError.badRequest('Une catégorie ne peut pas être son propre parent');
    }

    if (data.parent) {
      const parent = await Category.findById(data.parent).lean();
      if (!parent) throw ApiError.badRequest('Catégorie parente introuvable');
    }

    const imageField = data.image !== undefined ? this._normalizeImage(data.image) : undefined;
    const updateData = {
      ...data,
      ...(imageField !== undefined ? { image: imageField } : {}),
      level: data.parent ? 1 : data.parent === null ? 0 : undefined,
    };
    // Nettoyer les undefined
    Object.keys(updateData).forEach(k => (updateData as any)[k] === undefined && delete (updateData as any)[k]);

    const category = await Category.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!category) throw ApiError.notFound('Catégorie non trouvée');

    logger.info('Catégorie mise à jour', { id, name: category.name });
    return category;
  }

  // ── Suppression ───────────────────────────────────────────────────────────

  /**
   * Supprime une catégorie.
   * Lève une erreur si des produits y sont rattachés.
   */
  async delete(id: string): Promise<void> {
    const productCount = await Product.countDocuments({ category: id, isActive: true });
    if (productCount > 0) {
      throw ApiError.badRequest(
        `Impossible de supprimer : ${productCount} produit(s) actif(s) dans cette catégorie`,
      );
    }

    // Mettre les sous-catégories à la racine
    await Category.updateMany({ parent: id }, { $unset: { parent: '' }, $set: { level: 0 } });

    await Category.findByIdAndDelete(id);
    logger.info('Catégorie supprimée', { id });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  async generateUniqueSlug(name: string): Promise<string> {
    const base = createSlug(name);
    const existing = await Category.findOne({ slug: base }).lean();
    if (!existing) return base;
    return `${base}-${Date.now()}`;
  }

  private _normalizeImage(
    image?: string | { url: string; publicId?: string } | null,
  ): { url: string; publicId?: string } | undefined {
    if (!image) return undefined;
    if (typeof image === 'string') return { url: image };
    return image;
  }
}

export const categoryService = new CategoryService();
