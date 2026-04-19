/**
 * review.service.ts — Couche service pour la gestion des avis produit
 *
 * Centralise la logique métier extraite du controller :
 *   - Recalcul de la note moyenne via aggregation MongoDB (anti N+1)
 *   - Création d'un avis avec vérification doublon
 *   - Approbation / rejet d'un avis
 */

import mongoose from 'mongoose';
import Review, { IReview } from '../models/Review.model';
import Product from '../models/Product.model';
import { ApiError } from '../utils/ApiError';

// ─── Types internes ────────────────────────────────────────────────────────────

interface CreateReviewInput {
  product:  string | mongoose.Types.ObjectId;
  rating:   number;
  title?:   string;
  comment:  string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ReviewService {
  /**
   * Recalcule la note moyenne et le nombre d'avis d'un produit via aggregation.
   * Utilise une seule requête MongoDB au lieu du pattern N+1 (find + reduce).
   *
   * @param productId - Identifiant MongoDB du produit
   */
  async updateProductRating(productId: string | mongoose.Types.ObjectId): Promise<void> {
    const [result] = await Review.aggregate([
      {
        $match: {
          product:    new mongoose.Types.ObjectId(String(productId)),
          isApproved: true,
        },
      },
      {
        $group: {
          _id:       null,
          avgRating: { $avg: '$rating' },
          count:     { $sum: 1 },
        },
      },
    ]);

    await Product.findByIdAndUpdate(productId, {
      rating:     result ? Math.round(result.avgRating * 10) / 10 : 0,
      numReviews: result?.count ?? 0,
    });
  }

  /**
   * Crée un avis pour un produit.
   * Lève une erreur si l'utilisateur a déjà soumis un avis pour ce produit.
   *
   * @param userId - ID de l'utilisateur connecté
   * @param input  - Données de l'avis
   */
  async createReview(userId: string, input: CreateReviewInput): Promise<IReview> {
    const { product: productId, rating, title, comment } = input;

    const existing = await Review.findOne({ user: userId, product: productId });
    if (existing) throw ApiError.conflict('Vous avez déjà laissé un avis pour ce produit');

    const review = await Review.create({
      user:    userId,
      product: productId,
      rating,
      title,
      comment,
    });

    // Recalcul de la note moyenne via aggregation
    await this.updateProductRating(String(productId));

    return review;
  }

  /**
   * Approuve un avis en attente de modération.
   *
   * @param reviewId - ID de l'avis à approuver
   */
  async approveReview(reviewId: string): Promise<IReview> {
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status: 'approved', isApproved: true },
      { new: true },
    );
    if (!review) throw ApiError.notFound('Avis non trouvé');

    // Recalcul de la note produit après approbation
    await this.updateProductRating(review.product);

    return review;
  }

  /**
   * Rejette un avis en attente de modération.
   *
   * @param reviewId - ID de l'avis à rejeter
   */
  async rejectReview(reviewId: string): Promise<IReview> {
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status: 'rejected', isApproved: false },
      { new: true },
    );
    if (!review) throw ApiError.notFound('Avis non trouvé');
    return review;
  }
}

export const reviewService = new ReviewService();
