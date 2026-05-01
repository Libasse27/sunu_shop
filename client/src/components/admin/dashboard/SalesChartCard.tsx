// ─── Graphique Chiffre d'affaires avec filtres temporels ─────────────────────

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import AdminEmptyState from '../AdminEmptyState';
import { formatPrice } from '../../../utils/formatPrice';
import { GrowthBadge } from './DashboardHelpers';
import type { SalesPoint, SalesSummary } from './DashboardTypes';

const SALES_FILTERS = [
  { label: '7j', value: 7 },
  { label: '14j', value: 14 },
  { label: '30j', value: 30 },
  { label: '90j', value: 90 },
];

interface Props {
  salesData: SalesPoint[];
  salesSummary: SalesSummary | null;
  salesDays: number;
  salesLoading: boolean;
  onChangeDays: (days: number) => void;
}

export default function SalesChartCard({ salesData, salesSummary, salesDays, salesLoading, onChangeDays }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-900 text-base mb-0">Chiffre d'affaires</h3>
        <div className="flex gap-1">
          {SALES_FILTERS.map(f => (
            <button key={f.value} onClick={() => onChangeDays(f.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border-0 cursor-pointer"
              style={{ backgroundColor: salesDays === f.value ? '#009A44' : '#f1f5f9', color: salesDays === f.value ? '#fff' : '#64748b' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {salesSummary && !salesLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            {
              label: 'CA période', value: formatPrice(salesSummary.totalRevenue),
              sub: salesSummary.revenueGrowth !== null
                ? <GrowthBadge value={salesSummary.revenueGrowth} />
                : <span className="text-xs text-gray-400">vs période précédente</span>,
              color: '#009A44', bg: 'rgba(0,154,68,0.08)',
            },
            {
              label: 'Commandes', value: String(salesSummary.totalOrders),
              sub: salesSummary.ordersGrowth !== null
                ? <GrowthBadge value={salesSummary.ordersGrowth} />
                : <span className="text-xs text-gray-400">total période</span>,
              color: '#E31B23', bg: 'rgba(227,27,35,0.07)',
            },
            {
              label: 'Panier moyen', value: formatPrice(salesSummary.avgOrder),
              sub: <span className="text-xs text-gray-400">par commande</span>,
              color: '#635BFF', bg: 'rgba(99,91,255,0.07)',
            },
            {
              label: 'CA précédent', value: formatPrice(salesSummary.prevRevenue),
              sub: <span className="text-xs text-gray-400">période -{salesDays}j</span>,
              color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',
            },
          ].map(({ label, value, sub, bg }) => (
            <div key={label} className="rounded-xl p-3" style={{ backgroundColor: bg }}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="font-bold text-gray-900 text-sm mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>{value}</p>
              <div>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {salesLoading ? (
        <div className="animate-pulse bg-gray-100 rounded-xl" style={{ height: 220 }} />
      ) : salesData.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={salesData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#009A44" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#009A44" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ border: 'none', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
              formatter={(value: unknown, name: string) => [
                name === 'revenue' ? formatPrice(value as number) : `${value} cmd`,
                name === 'revenue' ? 'Revenus' : 'Commandes',
              ]}
            />
            <Area type="monotone" dataKey="revenue" stroke="#009A44" strokeWidth={2.5}
              fill="url(#salesGrad)" dot={false} activeDot={{ r: 4, fill: '#009A44' }} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <AdminEmptyState title="Aucune donnée de vente"
          description="Les données de vente apparaîtront ici une fois des commandes enregistrées." />
      )}
    </div>
  );
}
