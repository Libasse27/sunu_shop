// ─── Statuts commandes + Modes de paiement ────────────────────────────────────

import { Link } from 'react-router-dom';
import { CreditCard, ArrowUpRight } from 'lucide-react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import AdminEmptyState from '../AdminEmptyState';
import { formatPrice } from '../../../utils/formatPrice';
import { PAYMENT_META } from './DashboardHelpers';
import type { StatusDistribution, PaymentMethodData } from './DashboardTypes';

interface OrderStatusProps {
  statusData: StatusDistribution[];
  loading: boolean;
}

export function OrderStatusCard({ statusData, loading }: OrderStatusProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-base mb-0">Statuts des commandes</h3>
        <Link to="/admin/commandes" className="text-sm no-underline flex items-center gap-1" style={{ color: '#009A44' }}>
          Voir tout <ArrowUpRight size={12} />
        </Link>
      </div>
      {loading ? <div className="animate-pulse bg-gray-100 rounded-xl" style={{ height: 220 }} />
        : statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="45%" innerRadius={52} outerRadius={75} paddingAngle={3} dataKey="value">
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8}
                formatter={value => <span style={{ fontSize: 12, color: '#4B5563' }}>{value}</span>} />
              <Tooltip contentStyle={{ border: 'none', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : <AdminEmptyState title="Aucune commande" description="Les données de statuts apparaîtront ici." />}
    </div>
  );
}

interface PaymentMethodsProps {
  paymentMethods: PaymentMethodData[];
  loading: boolean;
}

export function PaymentMethodsCard({ paymentMethods, loading }: PaymentMethodsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-base mb-0 flex items-center gap-2">
          <CreditCard size={16} className="text-gray-500" />
          Modes de paiement
        </h3>
        <span className="text-xs text-gray-400">tous temps</span>
      </div>
      {loading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-12" />)}</div>
      ) : paymentMethods.length === 0 ? (
        <AdminEmptyState title="Aucune commande payée" description="Les statistiques de paiement apparaîtront ici." />
      ) : (
        <>
          <div className="flex items-center gap-4 mb-4">
            <PieChart width={110} height={110}>
              <Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={30} outerRadius={48} paddingAngle={2} dataKey="count">
                {paymentMethods.map((pm, i) => <Cell key={i} fill={PAYMENT_META[pm.method]?.color || '#94A3B8'} />)}
              </Pie>
              <Tooltip contentStyle={{ border: 'none', borderRadius: 8, fontSize: 11 }}
                formatter={(v: unknown, _: unknown, props: { payload?: { method?: string } }) => [
                  `${v} commandes`, PAYMENT_META[props.payload?.method ?? '']?.label || '',
                ]} />
            </PieChart>
            <div className="flex-1 flex flex-col gap-2">
              {paymentMethods.map(pm => {
                const meta = PAYMENT_META[pm.method] || { emoji: '💰', label: pm.method, color: '#94A3B8' };
                const totalCount = paymentMethods.reduce((s, x) => s + x.count, 0);
                const pct = totalCount ? Math.round((pm.count / totalCount) * 100) : 0;
                return (
                  <div key={pm.method} className="flex items-center gap-2">
                    <span className="text-sm">{meta.emoji}</span>
                    <span className="text-xs text-gray-600 w-28 truncate">{meta.label}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.slice(0, 4).map(pm => {
              const meta = PAYMENT_META[pm.method] || { emoji: '💰', label: pm.method, color: '#94A3B8' };
              return (
                <div key={pm.method} className="rounded-lg p-2.5" style={{ backgroundColor: meta.color + '10' }}>
                  <p className="text-xs text-gray-500 mb-0.5">{meta.emoji} {meta.label}</p>
                  <p className="text-sm font-bold mb-0" style={{ fontFamily: 'DM Sans, sans-serif', color: meta.color }}>{formatPrice(pm.total)}</p>
                  <p className="text-xs text-gray-400 mb-0">{pm.count} cmd</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
