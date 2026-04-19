interface Props {
  children: React.ReactNode;
  variant?: 'sale' | 'new' | 'outOfStock' | 'info' | 'success' | 'warning';
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles: Record<string, React.CSSProperties> = {
  sale: { background: '#E31B23', color: '#fff' },
  new: { background: '#009A44', color: '#fff' },
  outOfStock: { background: '#9CA3AF', color: '#fff' },
  info: { background: 'rgba(0,133,63,0.1)', color: '#009A44', border: '1px solid rgba(0,133,63,0.2)' },
  success: { background: 'rgba(0,133,63,0.1)', color: '#009A44' },
  warning: { background: 'rgba(252,209,22,0.2)', color: '#9A7A00' },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { fontSize: '10px', padding: '2px 6px' },
  md: { fontSize: '12px', padding: '4px 8px' },
};

export default function Badge({ children, variant = 'info', size = 'sm', className = '' }: Props) {
  return (
    <span
      className={`inline-block font-bold uppercase rounded-full ${className}`}
      style={{ ...variantStyles[variant], ...sizeStyles[size] }}
    >
      {children}
    </span>
  );
}
