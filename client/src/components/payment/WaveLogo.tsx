interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  className?: string;
}

const heights: Record<string, number> = { xs: 24, sm: 32, md: 40, lg: 56 };

export default function WaveLogo({ size = 'md', variant = 'full', className = '' }: Props) {
  const h = heights[size];

  return (
    <img
      src="/wave-icon.webp"
      alt="Wave"
      height={h}
      width={variant === 'icon' ? h : undefined}
      style={{
        height: h,
        width: variant === 'icon' ? h : 'auto',
        objectFit: 'contain',
      }}
      className={className}
    />
  );
}
