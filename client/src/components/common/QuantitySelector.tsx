import { Minus, Plus } from 'lucide-react';

interface Props {
  quantity: number;
  onChange: (qty: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export default function QuantitySelector({ quantity, onChange, min = 1, max = 99, size = 'md' }: Props) {
  const btnDim = size === 'sm' ? '28px' : '36px';
  const iconSize = size === 'sm' ? 14 : 16;
  const textW = size === 'sm' ? '32px' : '40px';
  const textClass = size === 'sm' ? 'text-sm' : '';

  return (
    <div className="flex items-center border rounded-xl overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
        className="p-0 flex items-center justify-center border-0 transition-colors disabled:opacity-50"
        style={{ width: btnDim, height: btnDim, background: 'transparent' }}
      >
        <Minus size={iconSize} />
      </button>
      <span
        className={`text-center font-semibold select-none border-l border-r ${textClass}`}
        style={{ width: textW, borderColor: '#E5E7EB' }}
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        className="p-0 flex items-center justify-center border-0 transition-colors disabled:opacity-50"
        style={{ width: btnDim, height: btnDim, background: 'transparent' }}
      >
        <Plus size={iconSize} />
      </button>
    </div>
  );
}
