import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Package, CreditCard, Tag, Settings, Star, Trash2, CheckCheck } from 'lucide-react';
import api from '../../services/api';

interface Notification {
  _id: string;
  type: 'order_status' | 'payment' | 'promotion' | 'system' | 'review';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  order_status: { icon: Package,    color: '#009A44', bg: 'rgba(0,154,68,0.1)',   label: 'Commande' },
  payment:      { icon: CreditCard, color: '#635BFF', bg: 'rgba(99,91,255,0.1)', label: 'Paiement' },
  promotion:    { icon: Tag,        color: '#F97316', bg: 'rgba(249,115,22,0.1)', label: 'Promo' },
  system:       { icon: Settings,   color: '#6B7280', bg: 'rgba(107,114,128,0.1)', label: 'Système' },
  review:       { icon: Star,       color: '#EAB308', bg: 'rgba(234,179,8,0.1)',  label: 'Avis' },
};

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return 'À l\'instant';
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function NotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const mountedRef = useRef(true);

  const fetchNotifications = useCallback(async (p: number) => {
    try {
      const { data } = await api.get(`/notifications?page=${p}&limit=20`);
      if (mountedRef.current) {
        setNotifications(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch { /* ignore */ }
    if (mountedRef.current) setLoading(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications(page);
    return () => { mountedRef.current = false; };
  }, [page, fetchNotifications]);

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  };

  const deleteNotif = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch { /* ignore */ }
  };

  const unread = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg text-gray-900 mb-0">Notifications</h2>
          {unread > 0 && <p className="text-sm text-gray-400 mb-0">{unread} non lue{unread > 1 ? 's' : ''}</p>}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white transition-colors hover:bg-gray-50 cursor-pointer"
            style={{ color: '#009A44' }}
          >
            <CheckCheck size={14} /> Tout marquer comme lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,154,68,0.08)' }}>
            <Bell size={28} style={{ color: '#009A44' }} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Aucune notification</p>
            <p className="text-sm text-gray-400 mb-0">Vous serez notifié des mises à jour de vos commandes ici.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {notifications.map(n => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
              const Icon = cfg.icon;
              return (
                <div
                  key={n._id}
                  className="bg-white rounded-2xl border overflow-hidden transition-all"
                  style={{ borderColor: n.isRead ? '#e5e7eb' : '#009A44', borderLeftWidth: n.isRead ? 1 : 3 }}
                >
                  <div className="flex gap-4 p-4">
                    <div className="rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ width: 40, height: 40, background: cfg.bg }}>
                      <Icon size={18} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-gray-900 mb-0">{n.title}</p>
                            {!n.isRead && (
                              <span className="rounded-full text-white font-bold px-1.5" style={{ fontSize: 9, background: '#009A44' }}>NEW</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mb-0">{n.message}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        {!n.isRead && (
                          <button onClick={() => markRead(n._id)} className="text-xs text-gray-400 hover:text-gray-700 border-0 bg-transparent cursor-pointer">
                            Marquer comme lu
                          </button>
                        )}
                        <button onClick={() => deleteNotif(n._id)} className="ml-auto text-gray-300 hover:text-red-400 border-0 bg-transparent cursor-pointer p-1 rounded">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-40 bg-white cursor-pointer">
                ←
              </button>
              <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-40 bg-white cursor-pointer">
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
