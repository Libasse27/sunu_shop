interface Props {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = { sm: 32, md: 52, lg: 80 };

export default function LoadingSpinner({ fullScreen = false, size = 'md' }: Props) {
  const s = SIZES[size];
  const stroke = size === 'sm' ? 3 : 4;

  const spinner = (
    <div className="flex flex-col items-center gap-2" role="status" aria-label="Chargement en cours">
      {/* Tri-color SVG spinner */}
      <svg
        width={s}
        height={s}
        viewBox="0 0 52 52"
        fill="none"
        className="animate-spin"
        style={{ animationDuration: '900ms' }}
      >
        {/* Track */}
        <circle cx="26" cy="26" r="22" stroke="#E5E7EB" strokeWidth={stroke} />
        {/* Green arc (top) */}
        <circle
          cx="26" cy="26" r="22"
          stroke="#009A44"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray="138.2 138.2"
          strokeDashoffset="103.6"
          transform="rotate(-90 26 26)"
        />
        {/* Gold arc (mid) */}
        <circle
          cx="26" cy="26" r="22"
          stroke="#FDEF42"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray="138.2 138.2"
          strokeDashoffset="117"
          transform="rotate(30 26 26)"
        />
        {/* Red arc (tail) */}
        <circle
          cx="26" cy="26" r="22"
          stroke="#E31B23"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray="138.2 138.2"
          strokeDashoffset="124"
          transform="rotate(150 26 26)"
        />
      </svg>

      {/* Three dots — pan-african */}
      {size !== 'sm' && (
        <div className="flex items-center gap-1">
          <span className="rounded-full" style={{ width: '6px', height: '6px', display: 'inline-block', background: '#009A44', animation: 'bounce 1s infinite', animationDelay: '0ms' }} />
          <span className="rounded-full" style={{ width: '6px', height: '6px', display: 'inline-block', background: '#FDEF42', animation: 'bounce 1s infinite', animationDelay: '150ms' }} />
          <span className="rounded-full" style={{ width: '6px', height: '6px', display: 'inline-block', background: '#E31B23', animation: 'bounce 1s infinite', animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        {spinner}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-6">{spinner}</div>;
}
