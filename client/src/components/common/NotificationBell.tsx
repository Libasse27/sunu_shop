import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Package, CreditCard, Tag, Settings, Star, X, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

interface Notification {
  _id: string;
  type: 'order_status' | 'payment' | 'promotion' | 'system' | 'review';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  order_status: { icon: Package,     color: '#009A44', bg: 'rgba(0,154,68,0.1)' },
  payment:      { icon: CreditCard,  color: '#635BFF', bg: 'rgba(99,91,255,0.1)' },
  promotion:    { icon: Tag,         color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
  system:       { icon: Settings,    color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  review:       { icon: Star,        color: '#EAB308', bg: 'rgba(234,179,8,0.1)' },
};

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return 'À l\'instant';
  if (diff < 3600)  return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} j`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = () => {
    api.get('/notifications?limit=8')
      .then(res => {
        const data: Notification[] = res.data.data || [];
        setNotifications(data);
        setUnread(data.filter(n => !n.isRead).length);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, []);

  // Fermer au clic extérieur
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch { /* ignore */ }
  };

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center rounded-lg border-0 bg-transparent text-gray-600 transition-all hover:bg-gray-100"
        style={{ width: '2.75rem', height: '2.75rem' }}
        title="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span
            className="absolute flex items-center justify-center rounded-full font-bold text-white"
            style={{ top: '-2px', right: '-2px', minWidth: '18px', height: '18px', padding: '0 3px', fontSize: '10px', backgroundColor: '#E31B23' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50"
            style={{ width: 360, top: '100%' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <Bell size={15} style={{ color: '#009A44' }} />
                <span className="font-bold text-sm text-gray-900">Notifications</span>
                {unread > 0 && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#E31B23' }}>{unread}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary px-2 py-1 rounded-lg hover:bg-gray-100 border-0 bg-transparent cursor-pointer transition-colors">
                    <CheckCheck size={12} /> Tout lire
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg border-0 bg-transparent cursor-pointer text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Liste */}
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-3 text-gray-400">
                  <Bell size={32} className="opacity-30" />
                  <p className="text-sm mb-0">Aucune notification</p>
                </div>
              ) : (
                notifications.map(n => {
                  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={n._id}
                      onClick={() => !n.isRead && markRead(n._id)}
                      className="flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0"
                      style={{ background: n.isRead ? 'white' : 'rgba(0,154,68,0.03)' }}
                    >
                      <div className="rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ width: 36, height: 36, background: cfg.bg }}>
                        <Icon size={16} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 mb-0 leading-snug">{n.title}</p>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                            {!n.isRead && <div className="rounded-full shrink-0" style={{ width: 7, height: 7, background: '#009A44' }} />}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-0 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t bg-gray-50">
              <Link
                to="/mon-compte/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-semibold no-underline transition-colors hover:underline"
                style={{ color: '#009A44' }}
              >
                Voir toutes les notifications →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
