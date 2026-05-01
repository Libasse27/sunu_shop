// ─── Modal de réponse admin à un avis client ─────────────────────────────────

import React from 'react';
import { X } from 'lucide-react';
import StarRating from '../../common/StarRating';

interface ReviewForReply {
  _id: string;
  product: { name: string };
  rating: number;
  comment: string;
  adminReply?: string;
}

interface Props {
  review: ReviewForReply | null;
  replyText: string;
  submitting: boolean;
  onClose: () => void;
  onReplyChange: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ReviewReplyModal({ review, replyText, submitting, onClose, onReplyChange, onSubmit }: Props) {
  if (!review) return null;

  return (
    <div className="fixed inset-0" style={{ zIndex: 60 }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full shadow-2xl" style={{ maxWidth: 520 }}>
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-bold text-gray-900 text-lg mb-0">Répondre à l'avis</h2>
            <button onClick={onClose} className="p-2 rounded-lg border-0 bg-gray-100 text-gray-500 cursor-pointer">
              <X size={20} />
            </button>
          </div>
          <div className="p-6">
            <div className="p-4 rounded-xl bg-gray-50 mb-4">
              <p className="font-medium text-sm mb-1">{review.product.name}</p>
              <StarRating rating={review.rating} />
              <p className="text-sm text-gray-600 italic mt-2 mb-0">"{review.comment}"</p>
            </div>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Votre réponse</label>
                <textarea
                  value={replyText}
                  onChange={e => onReplyChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                  rows={5}
                  placeholder="Merci pour votre avis..."
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Cette réponse sera visible publiquement sous l'avis.</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button" onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-lg text-sm text-white border-0 cursor-pointer disabled:opacity-60"
                  style={{ backgroundColor: '#009A44' }}
                >
                  {submitting ? 'Envoi...' : review.adminReply ? 'Mettre à jour' : 'Envoyer la réponse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
