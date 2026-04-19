import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AdminStatsCardProps {
  title: string;
  value: number | string;
  /** Pourcentage de changement vs période précédente (positif = hausse, négatif = baisse) */
  change?: number;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  loading?: boolean;
  suffix?: string;
  formatValue?: (v: number | string) => string;
}

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className ?? ''}`} />
  );
}

export default function AdminStatsCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = '#009A44',
  iconBg = 'rgba(0,154,68,0.12)',
  loading = false,
  suffix = '',
  formatValue,
}: AdminStatsCardProps) {
  // Détermine la couleur et l'icône de tendance
  const isPositive = typeof change === 'number' && change > 0;
  const isNegative = typeof change === 'number' && change < 0;
  const isNeutral = typeof change === 'number' && change === 0;

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const trendColor = isPositive
    ? 'text-[#009A44]'
    : isNegative
    ? 'text-[#E31B23]'
    : 'text-gray-400';
  const trendBg = isPositive
    ? 'bg-[#009A44]/10'
    : isNegative
    ? 'bg-[#E31B23]/10'
    : 'bg-gray-100';

  // Formate la valeur affichée
  const displayValue = loading
    ? ''
    : formatValue
    ? formatValue(value)
    : `${value}${suffix}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          {loading ? (
            <>
              <SkeletonPulse className="h-4 w-28 mb-1" />
              <SkeletonPulse className="h-8 w-36" />
            </>
          ) : (
            <>
              <span className="text-sm font-medium text-gray-500 truncate">{title}</span>
              <span className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
                {displayValue}
              </span>
            </>
          )}
        </div>

        {/* Icône dans un cercle coloré */}
        <div
          className="rounded-xl flex items-center justify-center shrink-0 ml-3"
          style={{
            width: 48,
            height: 48,
            backgroundColor: loading ? '#f3f4f6' : iconBg,
          }}
        >
          {loading ? (
            <div className="w-5 h-5 rounded bg-gray-300 animate-pulse" />
          ) : (
            <Icon size={22} style={{ color: iconColor }} />
          )}
        </div>
      </div>

      {/* Badge de tendance */}
      {!loading && typeof change === 'number' && (
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${trendColor} ${trendBg}`}>
            <TrendIcon size={12} />
            {isNeutral ? '0%' : `${isPositive ? '+' : ''}${change.toFixed(1)}%`}
          </span>
          <span className="text-xs text-gray-400">vs mois dernier</span>
        </div>
      )}

      {loading && (
        <SkeletonPulse className="h-5 w-24" />
      )}
    </div>
  );
}
