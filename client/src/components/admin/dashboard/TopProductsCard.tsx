// ─── Top Produits vendus ──────────────────────────────────────────────────────

import { Link } from 'react-router-dom';
import { Star, Package, ArrowUpRight } from 'lucide-react';
import AdminEmptyState from '../AdminEmptyState';
import { formatPrice } from '../../../utils/formatPrice';
import { RANK_COLORS } from './DashboardHelpers';
import type { TopProduct } from './DashboardTypes';

interface Props {
  topProducts: TopProduct[];
  loading: boolean;
}

export default function TopProductsCard({ topProducts, loading }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-base mb-0 flex items-center gap-2">
          <Star size={17} style={{ color: '#FCD116' }} /> Top Produits vendus
        </h3>
        <Link to="/admin/produits" className="text-sm no-underline flex items-center gap-1" style={{ color: '#009A44' }}>
          Voir tout <ArrowUpRight size={12} />
        </Link>
      </div>
      {loading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="animate-pulse bg-gray-200 rounded h-10 w-10 shrink-0" />
            <div className="flex-1"><div className="animate-pulse bg-gray-200 rounded h-3 w-2/3 mb-1.5" /><div className="animate-pulse bg-gray-200 rounded h-3 w-1/3" /></div>
          </div>
        ))}</div>
      ) : topProducts.length === 0 ? (
        <AdminEmptyState title="Aucune vente enregistrée" />
      ) : (() => {
        const maxSold = Math.max(...topProducts.map(p => p.totalSold), 1);
        return (
          <div className="flex flex-col gap-2">
            {topProducts.slice(0, 8).map((p, i) => {
              const pct = Math.round((p.totalSold / maxSold) * 100);
              return (
                <div key={p._id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                  <span className="rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ width: 22, height: 22, backgroundColor: RANK_COLORS[i] + '20', color: RANK_COLORS[i] }}>
                    {i + 1}
                  </span>
                  <div className="rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-gray-100" style={{ width: 40, height: 40 }}>
                    {p.images?.[0]?.url
                      ? <img src={p.images[0].url} alt="" className="object-cover w-full h-full" onError={e => { (e.target as HTMLImageElement).src = ''; }} />
                      : <Package size={16} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-0 truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: RANK_COLORS[i] || '#009A44' }} />
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">{p.totalSold} vente{p.totalSold !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold shrink-0" style={{ fontFamily: 'DM Sans, sans-serif', color: '#009A44' }}>
                    {formatPrice(p.price)}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
