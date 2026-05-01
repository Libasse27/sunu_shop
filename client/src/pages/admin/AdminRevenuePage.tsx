import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Calendar, BarChart2, Target, Minus,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { analyticsApi } from '../../services/admin.api';
import { formatPrice } from '../../utils/formatPrice';
import type { SalesPoint, SalesSummary } from '../../components/admin/dashboard/DashboardTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RevenueBreakdown {
  today: number;
  week: number;
  month: number;
  monthGrowth: number | null;
  year: number;
  allTime: number;
  avgOrder: number;
  totalOrders: number;
  monthly: Array<{ month: number; label: string; current: number; prev: number }>;
}

interface CategoryRevenue {
  _id: string; category: string; slug: string;
  revenue: number; ordersCount: number; avgOrderValue: number; share: number;
}

const PERIOD_FILTERS = [
  { label: '7 jours', value: 7 },
  { label: '30 jours', value: 30 },
  { label: '90 jours', value: 90 },
];

const CAT_COLORS = ['#009A44', '#E31B23', '#0EA5E9', '#F59E0B', '#8B5CF6', '#EC4899'];

// ─── Composant badge de croissance ────────────────────────────────────────────

function GrowthBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-gray-400">—</span>;
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full"
      style={{
        backgroundColor: positive ? 'rgba(0,154,68,0.1)' : 'rgba(227,27,35,0.1)',
        color: positive ? '#009A44' : '#E31B23',
      }}>
      <Icon size={10} />
      {value > 0 ? '+' : ''}{value}%
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color, bg, loading,
}: {
  label: string; value: string; sub?: React.ReactNode;
  icon: React.ElementType; color: string; bg: string; loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-gray-500 font-medium mb-0">{label}</p>
        <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: bg }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <p className="font-bold text-gray-900 text-lg mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>{value}</p>
      {sub && <div>{sub}</div>}
    </div>
  );
}

// ─── Tooltip personnalisé pour le graphe ──────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <span className="inline-block rounded-full" style={{ width: 8, height: 8, backgroundColor: p.color }} />
          <span className="text-gray-500">{p.name === 'revenue' ? 'CA' : p.name === 'current' ? new Date().getFullYear() : new Date().getFullYear() - 1} :</span>
          <span className="font-bold text-gray-900">{formatPrice(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AdminRevenuePage() {
  const [breakdown, setBreakdown] = useState<RevenueBreakdown | null>(null);
  const [salesData, setSalesData] = useState<SalesPoint[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [salesDays, setSalesDays] = useState(30);
  const [catRevenue, setCatRevenue] = useState<CategoryRevenue[]>([]);
  const [catTotal, setCatTotal] = useState(0);
  const [catDays, setCatDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(false);

  // Chargement initial
  useEffect(() => {
    setLoading(true);
    analyticsApi.getRevenueBreakdown()
      .then(res => setBreakdown(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Courbe tendance
  useEffect(() => {
    setSalesLoading(true);
    analyticsApi.getSalesData(salesDays)
      .then(res => {
        const d = res.data.data || {};
        setSalesData(d.points || []);
        setSalesSummary(d.summary || null);
      })
      .catch(() => { setSalesData([]); setSalesSummary(null); })
      .finally(() => setSalesLoading(false));
  }, [salesDays]);

  // Répartition catégories
  useEffect(() => {
    setCatLoading(true);
    analyticsApi.getRevenueByCategory(catDays)
      .then(res => {
        const d = res.data.data || {};
        setCatRevenue(d.categories || []);
        setCatTotal(d.totalRevenue || 0);
      })
      .catch(() => { setCatRevenue([]); setCatTotal(0); })
      .finally(() => setCatLoading(false));
  }, [catDays]);

  const year = new Date().getFullYear();

  return (
    <>
      <Helmet><title>Admin — Chiffre d'affaires | Sunu Shop</title></Helmet>
      <AdminLayout title="Chiffre d'affaires">
        <AdminPageHeader
          title="Chiffre d'affaires"
          subtitle="Suivi et analyse des revenus"
          breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: "Chiffre d'affaires" }]}
        />

        <div className="flex flex-col gap-6">

          {/* ── KPIs ──────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Aujourd'hui" loading={loading}
              value={formatPrice(breakdown?.today ?? 0)}
              icon={DollarSign} color="#009A44" bg="rgba(0,154,68,0.1)"
              sub={<span className="text-xs text-gray-400">CA journalier</span>}
            />
            <KpiCard label="Cette semaine" loading={loading}
              value={formatPrice(breakdown?.week ?? 0)}
              icon={Calendar} color="#0EA5E9" bg="rgba(14,165,233,0.1)"
              sub={<span className="text-xs text-gray-400">7 derniers jours</span>}
            />
            <KpiCard label="Ce mois" loading={loading}
              value={formatPrice(breakdown?.month ?? 0)}
              icon={BarChart2} color="#F59E0B" bg="rgba(245,158,11,0.1)"
              sub={breakdown && <GrowthBadge value={breakdown.monthGrowth} />}
            />
            <KpiCard label={`Année ${year}`} loading={loading}
              value={formatPrice(breakdown?.year ?? 0)}
              icon={TrendingUp} color="#8B5CF6" bg="rgba(139,92,246,0.1)"
              sub={<span className="text-xs text-gray-400">depuis le 1er janv.</span>}
            />
          </div>

          {/* ── Métriques globales ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="rounded-xl flex items-center justify-center shrink-0"
                style={{ width: 48, height: 48, backgroundColor: 'rgba(0,154,68,0.1)' }}>
                <Target size={22} style={{ color: '#009A44' }} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">CA total all-time</p>
                {loading
                  ? <div className="h-6 bg-gray-200 rounded animate-pulse w-32" />
                  : <p className="font-bold text-gray-900 text-xl mb-0" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {formatPrice(breakdown?.allTime ?? 0)}
                    </p>
                }
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="rounded-xl flex items-center justify-center shrink-0"
                style={{ width: 48, height: 48, backgroundColor: 'rgba(14,165,233,0.1)' }}>
                <ShoppingCart size={22} style={{ color: '#0EA5E9' }} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Commandes payées</p>
                {loading
                  ? <div className="h-6 bg-gray-200 rounded animate-pulse w-24" />
                  : <p className="font-bold text-gray-900 text-xl mb-0" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {(breakdown?.totalOrders ?? 0).toLocaleString('fr-FR')}
                    </p>
                }
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="rounded-xl flex items-center justify-center shrink-0"
                style={{ width: 48, height: 48, backgroundColor: 'rgba(245,158,11,0.1)' }}>
                <Minus size={22} style={{ color: '#F59E0B' }} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Panier moyen</p>
                {loading
                  ? <div className="h-6 bg-gray-200 rounded animate-pulse w-28" />
                  : <p className="font-bold text-gray-900 text-xl mb-0" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {formatPrice(breakdown?.avgOrder ?? 0)}
                    </p>
                }
              </div>
            </div>
          </div>

          {/* ── Courbe de tendance ──────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-gray-900 text-base mb-0.5">Évolution du CA</h3>
                {salesSummary && !salesLoading && (
                  <p className="text-sm text-gray-500 mb-0">
                    {formatPrice(salesSummary.totalRevenue)} sur {salesDays} jours
                    {salesSummary.revenueGrowth !== null && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: salesSummary.revenueGrowth >= 0 ? 'rgba(0,154,68,0.1)' : 'rgba(227,27,35,0.1)',
                          color: salesSummary.revenueGrowth >= 0 ? '#009A44' : '#E31B23',
                        }}>
                        {salesSummary.revenueGrowth >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {salesSummary.revenueGrowth > 0 ? '+' : ''}{salesSummary.revenueGrowth}% vs période précédente
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                {PERIOD_FILTERS.map(f => (
                  <button key={f.value} onClick={() => setSalesDays(f.value)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border-0 cursor-pointer"
                    style={{
                      backgroundColor: salesDays === f.value ? '#009A44' : '#f1f5f9',
                      color: salesDays === f.value ? '#fff' : '#64748b',
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Indicateurs résumé */}
            {salesSummary && !salesLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'CA période', value: formatPrice(salesSummary.totalRevenue), color: '#009A44', bg: 'rgba(0,154,68,0.07)' },
                  { label: 'Commandes', value: String(salesSummary.totalOrders), color: '#E31B23', bg: 'rgba(227,27,35,0.07)' },
                  { label: 'Panier moyen', value: formatPrice(salesSummary.avgOrder), color: '#635BFF', bg: 'rgba(99,91,255,0.07)' },
                  { label: 'CA précédent', value: formatPrice(salesSummary.prevRevenue), color: '#F59E0B', bg: 'rgba(245,158,11,0.07)' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className="rounded-xl p-3" style={{ backgroundColor: bg }}>
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="font-bold text-gray-900 text-sm mb-0" style={{ fontFamily: 'DM Sans, sans-serif', color }}>{value}</p>
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
                    <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#009A44" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#009A44" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#009A44" strokeWidth={2.5}
                    fill="url(#caGrad)" dot={false} activeDot={{ r: 4, fill: '#009A44' }} name="revenue" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <BarChart2 size={32} className="mb-3 opacity-40" />
                <p className="text-sm">Aucune donnée sur cette période</p>
              </div>
            )}
          </div>

          {/* ── CA mensuel de l'année ──────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-gray-900 text-base mb-0.5">CA mensuel — {year}</h3>
                <p className="text-sm text-gray-500 mb-0">Comparaison avec {year - 1}</p>
              </div>
              {breakdown && (
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block rounded-full w-2.5 h-2.5" style={{ backgroundColor: '#009A44' }} />
                    {year}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block rounded-full w-2.5 h-2.5" style={{ backgroundColor: '#CBD5E1' }} />
                    {year - 1}
                  </span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="animate-pulse bg-gray-100 rounded-xl" style={{ height: 240 }} />
            ) : breakdown?.monthly ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={breakdown.monthly} margin={{ top: 5, right: 5, left: 0, bottom: 5 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false}
                      tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="current" name="current" fill="#009A44" radius={[3, 3, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="prev"    name="prev"    fill="#CBD5E1" radius={[3, 3, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>

                {/* Table mensuelle */}
                <div className="mt-4 rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {['Mois', `CA ${year}`, `CA ${year - 1}`, 'Variation'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {breakdown.monthly.map(m => {
                        const growth = m.prev > 0 ? Math.round(((m.current - m.prev) / m.prev) * 100) : null;
                        const isCurrentMonth = m.month === new Date().getMonth() + 1;
                        return (
                          <tr key={m.month}
                            className="border-t hover:bg-gray-50 transition-colors"
                            style={{ backgroundColor: isCurrentMonth ? 'rgba(0,154,68,0.03)' : undefined }}>
                            <td className="px-4 py-2.5">
                              <span className="font-medium text-gray-900">{m.label}</span>
                              {isCurrentMonth && (
                                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                                  style={{ backgroundColor: 'rgba(0,154,68,0.1)', color: '#009A44' }}>
                                  en cours
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 font-bold" style={{ color: m.current > 0 ? '#009A44' : '#94A3B8' }}>
                              {m.current > 0 ? formatPrice(m.current) : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-gray-500">
                              {m.prev > 0 ? formatPrice(m.prev) : '—'}
                            </td>
                            <td className="px-4 py-2.5">
                              <GrowthBadge value={growth} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td className="px-4 py-2.5 font-bold text-gray-900">Total</td>
                        <td className="px-4 py-2.5 font-bold" style={{ color: '#009A44' }}>
                          {formatPrice(breakdown.monthly.reduce((s, m) => s + m.current, 0))}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-gray-600">
                          {formatPrice(breakdown.monthly.reduce((s, m) => s + m.prev, 0))}
                        </td>
                        <td className="px-4 py-2.5">
                          <GrowthBadge value={(() => {
                            const cur = breakdown.monthly.reduce((s, m) => s + m.current, 0);
                            const prv = breakdown.monthly.reduce((s, m) => s + m.prev, 0);
                            return prv > 0 ? Math.round(((cur - prv) / prv) * 100) : null;
                          })()} />
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            ) : null}
          </div>

          {/* ── Répartition par catégorie ──────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-gray-900 text-base mb-0.5">CA par catégorie</h3>
                {catTotal > 0 && (
                  <p className="text-sm text-gray-500 mb-0">
                    Total : <strong>{formatPrice(catTotal)}</strong> sur {catDays} jours
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                {[30, 60, 90].map(d => (
                  <button key={d} onClick={() => setCatDays(d)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border-0 cursor-pointer"
                    style={{
                      backgroundColor: catDays === d ? '#009A44' : '#f1f5f9',
                      color: catDays === d ? '#fff' : '#64748b',
                    }}>
                    {d}j
                  </button>
                ))}
              </div>
            </div>

            {catLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-10" />
                ))}
              </div>
            ) : catRevenue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <BarChart2 size={32} className="mb-3 opacity-40" />
                <p className="text-sm">Aucune donnée pour cette période</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Barres horizontales */}
                <div className="flex flex-col gap-3">
                  {catRevenue.map((cat, i) => (
                    <div key={cat._id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold" style={{ color: CAT_COLORS[i % CAT_COLORS.length] }}>
                            {formatPrice(cat.revenue)}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">{cat.share}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${cat.share}%`, backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {cat.ordersCount} commande{cat.ordersCount > 1 ? 's' : ''} · panier moy. {formatPrice(cat.avgOrderValue)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Bar chart horizontal */}
                <ResponsiveContainer width="100%" height={Math.max(180, catRevenue.length * 44)}>
                  <BarChart
                    data={catRevenue.map((c, i) => ({ name: c.category, revenue: c.revenue, fill: CAT_COLORS[i % CAT_COLORS.length] }))}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                    barSize={20}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false}
                      tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#374151' }} tickLine={false} axisLine={false} width={90} />
                    <Tooltip
                      contentStyle={{ border: 'none', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                      formatter={(v: unknown) => [formatPrice(v as number), 'CA']}
                    />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {catRevenue.map((_, i) => (
                        <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>
      </AdminLayout>
    </>
  );
}
