// ─── Tableau meilleurs clients ────────────────────────────────────────────────

import { Link } from 'react-router-dom';
import { Crown, Users, ShoppingCart, ArrowUpRight, ChevronRight } from 'lucide-react';
import AdminEmptyState from '../AdminEmptyState';
import { formatPrice } from '../../../utils/formatPrice';
import { InitialsAvatar, RANK_COLORS } from './DashboardHelpers';
import type { TopCustomer } from './DashboardTypes';

interface Props {
  topCustomers: TopCustomer[];
  loading: boolean;
}

export default function TopCustomersCard({ topCustomers, loading }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-900 text-base mb-0 flex items-center gap-2">
          <Crown size={17} style={{ color: '#FCD116' }} />
          Meilleurs clients
        </h3>
        <Link to="/admin/clients" className="text-sm no-underline flex items-center gap-1" style={{ color: '#009A44' }}>
          Voir tous <ArrowUpRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="rounded-full bg-gray-200 shrink-0" style={{ width: 36, height: 36 }} />
              <div className="flex-1"><div className="bg-gray-200 rounded h-3 w-2/5 mb-1.5" /><div className="bg-gray-200 rounded h-3 w-1/4" /></div>
              <div className="bg-gray-200 rounded h-4 w-24" />
              <div className="bg-gray-200 rounded h-4 w-16" />
            </div>
          ))}
        </div>
      ) : topCustomers.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title="Aucune transaction client"
          description="Les meilleurs clients apparaîtront ici dès les premières commandes payées."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="pb-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rang</th>
                <th className="pb-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pl-3">Client</th>
                <th className="pb-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Total dépensé</th>
                <th className="pb-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Commandes</th>
                <th className="pb-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Panier moy.</th>
                <th className="pb-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Dernière cmd</th>
                <th className="pb-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider" />
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((customer, i) => (
                <tr key={customer._id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3">
                    <div
                      className="rounded-full flex items-center justify-center font-bold text-xs"
                      style={{ width: 24, height: 24, backgroundColor: RANK_COLORS[i] + '20', color: RANK_COLORS[i] }}
                    >
                      {i + 1}
                    </div>
                  </td>
                  <td className="py-3 pl-3">
                    <div className="flex items-center gap-2.5">
                      <InitialsAvatar firstName={customer.firstName} lastName={customer.lastName} size={34} />
                      <div style={{ minWidth: 0 }}>
                        <p className="font-semibold text-gray-900 text-sm mb-0 truncate" style={{ maxWidth: 140 }}>
                          {customer.firstName} {customer.lastName}
                          {i === 0 && <span className="ml-1.5 text-xs" title="Meilleur client">👑</span>}
                        </p>
                        <p className="text-xs text-gray-400 mb-0 truncate" style={{ maxWidth: 140 }}>{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <span className="font-bold text-gray-900" style={{ fontFamily: 'DM Sans, sans-serif', color: RANK_COLORS[i] }}>
                      {formatPrice(customer.totalSpent)}
                    </span>
                  </td>
                  <td className="py-3 text-right hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(0,154,68,0.08)', color: '#009A44' }}>
                      <ShoppingCart size={10} />
                      {customer.orderCount}
                    </span>
                  </td>
                  <td className="py-3 text-right text-gray-500 text-xs hidden md:table-cell">
                    {formatPrice(customer.avgOrderValue)}
                  </td>
                  <td className="py-3 text-right text-xs text-gray-400 hidden lg:table-cell">
                    {new Date(customer.lastOrderDate).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      to={`/admin/commandes?search=${encodeURIComponent(customer.email)}`}
                      className="p-1.5 rounded-lg inline-flex no-underline"
                      style={{ backgroundColor: 'rgba(0,154,68,0.08)', color: '#009A44' }}
                      title="Voir les commandes"
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {topCustomers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
              {[
                { label: 'Total top 10', value: formatPrice(topCustomers.reduce((s, c) => s + c.totalSpent, 0)), color: '#009A44' },
                { label: 'Commandes cumulées', value: String(topCustomers.reduce((s, c) => s + c.orderCount, 0)), color: '#E31B23' },
                {
                  label: 'Panier moy. top 10',
                  value: formatPrice(Math.round(topCustomers.reduce((s, c) => s + c.avgOrderValue, 0) / topCustomers.length)),
                  color: '#635BFF',
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center p-3 rounded-xl" style={{ backgroundColor: color + '08' }}>
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="font-bold text-sm mb-0" style={{ color, fontFamily: 'DM Sans, sans-serif' }}>{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
