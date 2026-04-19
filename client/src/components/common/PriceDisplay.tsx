import { formatPrice } from '../../utils/formatPrice';

interface Props {
  price: number;
  comparePrice?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: { price: 'text-sm font-bold', compare: '' },
  md: { price: 'text-xl font-bold', compare: 'text-sm' },
  lg: { price: 'text-2xl font-bold', compare: '' },
};

export default function PriceDisplay({ price, comparePrice, size = 'md', className = '' }: Props) {
  const hasDiscount = comparePrice && comparePrice > price;
  const classes = sizeClasses[size];

  return (
    <div className={`flex items-baseline gap-2 flex-wrap ${className}`}>
      <span
        className={classes.price}
        style={{ color: hasDiscount ? '#E31B23' : '#111827' }}
      >
        {formatPrice(price)}
      </span>
      {hasDiscount && (
        <>
          <span className={`${classes.compare} text-gray-500 line-through`}>
            {formatPrice(comparePrice)}
          </span>
          <span
            className="font-bold rounded-full"
            style={{ fontSize: '10px', padding: '2px 6px', background: '#E31B23', color: '#fff' }}
          >
            -{Math.round(((comparePrice - price) / comparePrice) * 100)}%
          </span>
        </>
      )}
    </div>
  );
}
