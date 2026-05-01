// ─── Activité récente + Alertes Stock (grille 2 colonnes) ────────────────────

import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, ShoppingCart, Users, Package, ArrowUpRight } from 'lucide-react';
import AdminEmptyState from '../AdminEmptyState';
import { formatPrice } from '../../../utils/formatPrice';
import { STATUS_COLORS, STATUS_LABELS, relativeTime } from './DashboardHelpers';
import type { ActivityItem, LowStockProduct } from './DashboardTypes';

interface ActivityCardProps {
  recentActivity: ActivityItem[];
  loading: boolean;
}

export function RecentActivityCard({ recentActivity, loading }: ActivityCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-base mb-0 flex items-center gap-2">
          <Activity size={17} style={{ color: '#009A44' }} /> Activité récente
        </h3>
      </div>
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="animate-pulse bg-gray-200 rounded-full shrink-0" style={{ width: 32, height: 32 }} />
              <div className="flex-1">
                <div className="animate-pulse bg-gray-200 rounded h-3 w-3/4 mb-1.5" />
                <div className="animate-pulse bg-gray-200 rounded h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : recentActivity.length === 0 ? (
        <AdminEmptyState title="Aucune activité" description="Les événements récents apparaîtront ici." />
      ) : (
        <div className="flex flex-col gap-2">
          {recentActivity.slice(0, 10).map((item, i) => {
            const isOrder = item.type === 'order';
            const isUser = item.type === 'user';
            const d = item.data;
            return (
              <div key={i} className="flex items-start gap-3 py-1.5 border-b border-gray-50 last:border-0">
                <div className="rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ width: 30, height: 30, backgroundColor: isOrder ? 'rgba(0,154,68,0.1)' : isUser ? 'rgba(206,17,38,0.08)' : '#f3f4f6' }}>
                  {isOrder ? <ShoppingCart size={14} style={{ color: '#009A44' }} />
                    : isUser ? <Users size={14} style={{ color: '#E31B23' }} />
                    : <Activity size={14} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  {isOrder ? (
                    <>
                      <p className="text-sm text-gray-800 mb-0 leading-snug">
                        Commande <span className="font-semibold">{d.orderNumber}</span>
                        {' — '}<span style={{ color: STATUS_COLORS[d.status ?? ''] || '#6B7280' }}>{STATUS_LABELS[d.status ?? ''] || d.status}</span>
                      </p>
                      {d.user && (
                        <p className="text-xs text-gray-400 mb-0">
                          {d.user.firstName} {d.user.lastName} · {formatPrice(d.pricing?.total ?? 0)}
                        </p>
                      )}
                    </>
                  ) : isUser ? (
                    <p className="text-sm text-gray-800 mb-0 leading-snug">
                      Nouveau client : <span className="font-semibold">{d.firstName} {d.lastName}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-800 mb-0 leading-snug">Événement</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5 mb-0">{relativeTime(item.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface StockCardProps {
  lowStock: LowStockProduct[];
  loading: boolean;
}

export function LowStockCard({ lowStock, loading }: StockCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-base mb-0 flex items-center gap-2">
          <AlertTriangle size={17} style={{ color: '#E31B23' }} /> Alertes Stock
        </h3>
        <Link to="/admin/produits" className="text-sm no-underline flex items-center gap-1" style={{ color: '#009A44' }}>
          Gérer <ArrowUpRight size={12} />
        </Link>
      </div>
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="animate-pulse bg-gray-200 rounded flex-1 h-8" />
              <div className="animate-pulse bg-gray-200 rounded h-6 w-16" />
            </div>
          ))}
        </div>
      ) : lowStock.length === 0 ? (
        <AdminEmptyState title="Aucune alerte de stock" description="Tous les produits sont bien approvisionnés." />
      ) : (
        <div className="flex flex-col gap-3">
          {lowStock.slice(0, 6).map(p => (
            <div key={p._id} className="flex items-center gap-3">
              <Package size={17} className="shrink-0" style={{ color: '#E31B23' }} />
              <div className="flex-1" style={{ minWidth: 0 }}>
                <p className="text-sm font-medium text-gray-900 mb-0 truncate">{p.name}</p>
                <p className="text-xs text-gray-500 mb-0">SKU: {p.sku}</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full shrink-0"
                style={{ backgroundColor: p.stock === 0 ? 'rgba(227,27,35,0.1)' : 'rgba(252,209,22,0.15)', color: p.stock === 0 ? '#E31B23' : '#8B7000' }}>
                {p.stock === 0 ? 'Rupture' : `${p.stock} restant${p.stock > 1 ? 's' : ''}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
