// ─── Revenus par catégorie avec graphique et tableau ─────────────────────────

import { Link } from 'react-router-dom';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from 'recharts';
import AdminEmptyState from '../AdminEmptyState';
import { formatPrice } from '../../../utils/formatPrice';
import { getCategoryMeta } from './DashboardHelpers';
import type { CategoryRevenue } from './DashboardTypes';

interface Props {
  categoryRevenue: CategoryRevenue[];
  categoryTotal: number;
  catDays: number;
  loading: boolean;
  onChangeDays: (days: number) => void;
}

export default function CategoryRevenueCard({ categoryRevenue, categoryTotal, catDays, loading, onChangeDays }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-900 text-base mb-0 flex items-center gap-2">
          <TrendingUp size={17} style={{ color: '#009A44' }} />
          Revenus par catégorie
        </h3>
        <div className="flex items-center gap-2">
          {[30, 60, 90].map(d => (
            <button key={d} onClick={() => onChangeDays(d)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border-0 cursor-pointer"
              style={{ backgroundColor: catDays === d ? '#009A44' : '#f1f5f9', color: catDays === d ? '#fff' : '#64748b' }}>
              {d}j
            </button>
          ))}
          <Link to="/admin/produits" className="text-sm no-underline flex items-center gap-1 ml-1" style={{ color: '#009A44' }}>
            Produits <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>

      {loading || categoryRevenue.length === 0 ? (
        loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-10" />)}
          </div>
        ) : (
          <AdminEmptyState title="Aucune donnée"
            description="Les revenus par catégorie apparaîtront après les premières ventes." />
        )
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryRevenue.slice(0, 6).map(cat => {
              const meta = getCategoryMeta(cat.slug, cat.category);
              return (
                <div key={cat._id} className="rounded-xl border border-gray-100 p-3" style={{ backgroundColor: meta.color + '08' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base leading-none">{meta.emoji}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: meta.color + '15', color: meta.color }}>
                      {cat.share}%
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-700 mb-1 truncate">{meta.label}</p>
                  <p className="font-bold text-sm mb-1" style={{ fontFamily: 'DM Sans, sans-serif', color: meta.color }}>
                    {formatPrice(cat.revenue)}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>{cat.ordersCount} commande{cat.ordersCount > 1 ? 's' : ''}</span>
                    <span>moy. {formatPrice(cat.avgOrderValue)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.share}%`, backgroundColor: meta.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégorie</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">CA</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Part</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Commandes</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Panier moy.</th>
                </tr>
              </thead>
              <tbody>
                {categoryRevenue.map((cat, i) => {
                  const meta = getCategoryMeta(cat.slug, cat.category);
                  return (
                    <tr key={cat._id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span>{meta.emoji}</span>
                          <span className="font-medium text-gray-900">{meta.label}</span>
                          {i === 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                              style={{ backgroundColor: '#FCD11620', color: '#8B7000' }}>
                              #1
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold" style={{ color: meta.color }}>
                        {formatPrice(cat.revenue)}
                      </td>
                      <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                            <div className="h-full rounded-full" style={{ width: `${cat.share}%`, backgroundColor: meta.color }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-600">{cat.share}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-500 hidden md:table-cell">{cat.ordersCount}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500 hidden md:table-cell">{formatPrice(cat.avgOrderValue)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td className="px-4 py-2.5 font-bold text-gray-900 text-sm">Total</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-900" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {formatPrice(categoryTotal)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-600 hidden sm:table-cell">100%</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-600 hidden md:table-cell">
                    {categoryRevenue.reduce((s, c) => s + c.ordersCount, 0)}
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell" />
                </tr>
              </tfoot>
            </table>
          </div>

          <ResponsiveContainer width="100%" height={120}>
            <BarChart
              data={categoryRevenue.slice(0, 6).map(c => {
                const meta = getCategoryMeta(c.slug, c.category);
                return { name: meta.emoji, revenue: c.revenue, fill: meta.color };
              })}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              barSize={28}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 16 }} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ border: 'none', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                formatter={(v: unknown) => [formatPrice(v as number), 'CA']}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {categoryRevenue.slice(0, 6).map((c, i) => (
                  <Cell key={i} fill={getCategoryMeta(c.slug, c.category).color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
