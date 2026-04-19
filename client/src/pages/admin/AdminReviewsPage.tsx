import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Star, CheckCircle, XCircle, MessageSquare, X, Eye, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog';
import { adminReviewsApi } from '../../services/admin.api';
import StarRating from '../../components/common/StarRating';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Review {
  _id: string;
  product: { _id: string; name: string; slug: string; images?: { url: string }[] };
  user: { _id: string; firstName: string; lastName: string; email: string };
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  adminReply?: string;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const configs = {
    approved: { label: 'Approuvé', bg: 'rgba(0,154,68,0.1)', color: '#009A44' },
    pending:  { label: 'En attente', bg: 'rgba(252,209,22,0.15)', color: '#8B7000' },
    rejected: { label: 'Rejeté', bg: 'rgba(227,27,35,0.1)', color: '#E31B23' },
  };
  const cfg = configs[status as keyof typeof configs] || { label: status, bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // Reply modal
  const [replyReview, setReplyReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Reject confirm
  const [rejectTarget, setRejectTarget] = useState<Review | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data } = await adminReviewsApi.getList({
        page, limit: 20,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setReviews(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
      if (statusFilter === 'all' && !search) {
        setPendingCount((data.data || []).filter((r: Review) => r.status === 'pending').length);
      }
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, [page, statusFilter, search]);

  const handleApprove = async (id: string) => {
    try {
      await adminReviewsApi.approve(id);
      toast.success('Avis approuvé');
      fetchReviews();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de l'approbation");
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await adminReviewsApi.reject(rejectTarget._id);
      toast.success('Avis rejeté');
      setRejectTarget(null);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du rejet');
    } finally {
      setRejecting(false);
    }
  };

  const openReplyModal = (review: Review) => {
    setReplyReview(review);
    setReplyText(review.adminReply || '');
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyReview || !replyText.trim()) { toast.error('La réponse ne peut pas être vide'); return; }
    setSubmittingReply(true);
    try {
      await adminReviewsApi.reply(replyReview._id, replyText);
      toast.success('Réponse enregistrée');
      setReplyReview(null);
      setReplyText('');
      fetchReviews();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminReviewsApi.delete(deleteTarget._id);
      toast.success('Avis supprimé');
      setDeleteTarget(null);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setDeleting(false);
    }
  };

  const FILTER_TABS = [
    { value: 'all', label: 'Tous' },
    { value: 'pending', label: 'En attente' },
    { value: 'approved', label: 'Approuvés' },
    { value: 'rejected', label: 'Rejetés' },
  ] as const;

  return (
    <>
      <Helmet><title>Admin — Avis clients | Sunu Shop</title></Helmet>
      <AdminLayout title="Avis clients">
        <AdminPageHeader
          title="Avis clients"
          subtitle={pendingCount > 0 ? `${pendingCount} avis en attente de modération` : `${total} avis au total`}
          breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Avis clients' }]}
        />

        <div className="flex flex-col gap-4">
          {/* Filtres + tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Onglets statut */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                  className="px-4 py-2 text-sm font-medium border-0 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: statusFilter === tab.value ? '#009A44' : 'transparent',
                    color: statusFilter === tab.value ? '#fff' : '#6b7280',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Recherche */}
            <div className="relative">
              <Search size={15} className="absolute text-gray-400" style={{ left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-lg text-sm py-2 pr-3 focus:outline-none"
                style={{ paddingLeft: 34, width: 280 }}
                placeholder="Rechercher un avis..."
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-4 flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="rounded bg-gray-200 shrink-0" style={{ width: 40, height: 40 }} />
                    <div className="flex-1"><div className="bg-gray-200 rounded h-3 w-1/3 mb-1.5" /><div className="bg-gray-200 rounded h-3 w-1/2" /></div>
                    <div className="bg-gray-200 rounded h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <AdminEmptyState
                icon={Star}
                title={statusFilter !== 'all' ? 'Aucun avis dans cette catégorie' : 'Aucun avis reçu'}
                description={search ? 'Essayez un autre terme de recherche.' : undefined}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produit</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Commentaire</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map(review => (
                      <tr key={review._id} className="hover:bg-gray-50 transition-colors border-t">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {review.product.images?.[0]?.url ? (
                              <img src={review.product.images[0].url} alt="" className="rounded-lg object-cover shrink-0" style={{ width: 40, height: 40 }} />
                            ) : null}
                            <div>
                              <p className="font-medium text-sm mb-0 truncate" style={{ maxWidth: 160 }}>{review.product.name}</p>
                              <Link to={`/produit/${review.product.slug}`} target="_blank"
                                className="text-xs no-underline flex items-center gap-1" style={{ color: '#009A44' }}>
                                <Eye size={11} /> Voir
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm mb-0">{review.user.firstName} {review.user.lastName}</p>
                          <p className="text-xs text-gray-400 mb-0">{review.user.email}</p>
                        </td>
                        <td className="px-4 py-3"><StarRating rating={review.rating} /></td>
                        <td className="px-4 py-3">
                          <p className="text-gray-600 text-sm mb-0 line-clamp-2" style={{ maxWidth: 240 }}>{review.comment}</p>
                          {review.adminReply && (
                            <span className="text-xs mt-1 flex items-center gap-1" style={{ color: '#009A44' }}>
                              <MessageSquare size={11} /> Réponse envoyée
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={review.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {review.status === 'pending' && (
                              <button onClick={() => handleApprove(review._id)} title="Approuver"
                                className="p-1.5 rounded-lg border-0 cursor-pointer" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                                <CheckCircle size={16} />
                              </button>
                            )}
                            {review.status === 'pending' && (
                              <button onClick={() => setRejectTarget(review)} title="Rejeter"
                                className="p-1.5 rounded-lg border-0 cursor-pointer" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                                <XCircle size={16} />
                              </button>
                            )}
                            {review.status === 'approved' && (
                              <button onClick={() => openReplyModal(review)} title="Répondre"
                                className="p-1.5 rounded-lg border-0 cursor-pointer" style={{ backgroundColor: 'rgba(0,154,68,0.1)', color: '#009A44' }}>
                                <MessageSquare size={16} />
                              </button>
                            )}
                            <button onClick={() => setDeleteTarget(review)} title="Supprimer"
                              className="p-1.5 rounded-lg border-0 cursor-pointer" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-40 bg-white">
                  Précédent
                </button>
                <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-40 bg-white">
                  Suivant
                </button>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>

      {/* Modal réponse (custom) */}
      {replyReview && (
        <div className="fixed inset-0" style={{ zIndex: 60 }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setReplyReview(null)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full shadow-2xl" style={{ maxWidth: 520 }}>
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="font-bold text-gray-900 text-lg mb-0">Répondre à l'avis</h2>
                <button onClick={() => setReplyReview(null)} className="p-2 rounded-lg border-0 bg-gray-100 text-gray-500 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="p-4 rounded-xl bg-gray-50 mb-4">
                  <p className="font-medium text-sm mb-1">{replyReview.product.name}</p>
                  <StarRating rating={replyReview.rating} />
                  <p className="text-sm text-gray-600 italic mt-2 mb-0">"{replyReview.comment}"</p>
                </div>
                <form onSubmit={handleSubmitReply} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Votre réponse</label>
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                      rows={5}
                      placeholder="Merci pour votre avis..."
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">Cette réponse sera visible publiquement sous l'avis.</p>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setReplyReview(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white cursor-pointer">
                      Annuler
                    </button>
                    <button type="submit" disabled={submittingReply} className="flex-1 px-4 py-2 rounded-lg text-sm text-white border-0 cursor-pointer disabled:opacity-60"
                      style={{ backgroundColor: '#009A44' }}>
                      {submittingReply ? 'Envoi...' : replyReview.adminReply ? 'Mettre à jour' : 'Envoyer la réponse'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <AdminConfirmDialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        loading={rejecting}
        variant="warning"
        title="Rejeter l'avis ?"
        message="Cet avis sera marqué comme rejeté et ne sera plus visible sur le site."
        confirmLabel="Rejeter"
      />

      <AdminConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Supprimer l'avis ?"
        message="Cet avis sera supprimé définitivement. Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
      />
    </>
  );
}
