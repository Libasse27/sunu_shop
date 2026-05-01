import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../../store/store';
import StarRating from '../common/StarRating';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { getApiError } from '../../utils/getApiError';
import { ThumbsUp, User, CheckCircle } from 'lucide-react';

interface Review {
  _id: string;
  user: { firstName: string; lastName: string };
  rating: number;
  title?: string;
  comment: string;
  helpful: number;
  adminReply?: { text: string; date?: string };
  createdAt: string;
}

interface Props {
  productId: string;
}

export default function ProductReviews({ productId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await api.get(`/reviews/product/${productId}`);
        setReviews(data.data?.reviews || []);
      } catch { /* ignore */ }
      setIsLoading(false);
    };
    fetchReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Veuillez donner une note'); return; }
    if (!comment.trim()) { toast.error('Veuillez écrire un commentaire'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post('/reviews', { product: productId, rating, title, comment });
      setReviews([data.data, ...reviews]);
      setShowForm(false);
      setRating(0);
      setTitle('');
      setComment('');
      setHasReviewed(true);
      toast.success('Avis envoyé ! Il sera visible après modération.');
    } catch (err: unknown) {
      toast.error(getApiError(err, "Erreur lors de l'envoi"));
    }
    setSubmitting(false);
  };

  const handleHelpful = async (reviewId: string) => {
    try {
      await api.post(`/reviews/${reviewId}/helpful`);
      setReviews(reviews.map((r) => r._id === reviewId ? { ...r, helpful: r.helpful + 1 } : r));
    } catch { /* ignore */ }
  };

  if (isLoading) return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-gray-100 rounded-lg animate-pulse" style={{ height: 96 }} />
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold mb-0">Avis clients ({reviews.length})</h3>
        {user && !hasReviewed && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(!showForm)}
            className="btn-outline text-sm"
          >
            {showForm ? 'Annuler' : 'Écrire un avis'}
          </motion.button>
        )}
        {user && hasReviewed && (
          <span className="text-sm text-green-600 font-medium flex items-center gap-1">
            <CheckCircle size={14} /> Avis envoyé, en attente de modération
          </span>
        )}
        {!user && (
          <Link
            to={`/connexion?redirect=${encodeURIComponent(window.location.pathname)}`}
            className="text-sm font-semibold"
            style={{ color: '#009A44' }}
          >
            Connectez-vous pour laisser un avis →
          </Link>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="bg-green-50 rounded-xl p-4 mb-4 flex flex-col gap-3"
          >
            <div>
              <label className="block text-sm font-semibold mb-2">Votre note</label>
              <StarRating rating={rating} interactive onChange={setRating} size={24} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Titre (optionnel)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Résumez votre avis"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Votre commentaire</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="input-field"
                style={{ resize: 'none' }}
                placeholder="Partagez votre expérience..."
                required
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? 'Envoi...' : 'Publier mon avis'}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {reviews.length === 0 ? (
        <p className="text-gray-500 text-center py-10">Aucun avis pour ce produit. Soyez le premier !</p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-b pb-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{ width: 40, height: 40, background: 'rgba(0,154,68,0.1)' }}
                  >
                    <User size={18} style={{ color: '#009A44' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-0">{review.user.firstName} {review.user.lastName?.charAt(0)}.</p>
                    <p className="text-gray-500" style={{ fontSize: 11 }}>
                      {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <StarRating rating={review.rating} size={14} />
              </div>
              {review.title && <p className="font-semibold text-sm mb-1">{review.title}</p>}
              <p className="text-gray-500 text-sm mb-0">{review.comment}</p>
              {review.adminReply && (
                <div className="mt-3 ml-4 pl-3" style={{ borderLeft: '2px solid rgba(0,154,68,0.3)' }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#009A44' }}>Réponse de Sunu Shop</p>
                  <p className="text-sm text-gray-500 mb-0">{review.adminReply.text}</p>
                </div>
              )}
              <button
                onClick={() => handleHelpful(review._id)}
                className="mt-3 flex items-center gap-2 text-sm text-gray-500 bg-transparent border-0 p-0 cursor-pointer"
              >
                <ThumbsUp size={14} /> Utile ({review.helpful})
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
