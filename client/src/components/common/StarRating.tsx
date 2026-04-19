import { Star } from 'lucide-react';

interface Props {
  rating: number;
  maxRating?: number;
  size?: number;
  showValue?: boolean;
  count?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 16,
  showValue = false,
  count,
  interactive = false,
  onChange,
}: Props) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: maxRating }, (_, i) => {
          const filled = i < Math.floor(rating);
          const half = !filled && i < rating;
          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange?.(i + 1)}
              className={`p-0 border-0 bg-transparent ${interactive ? 'cursor-pointer' : 'cursor-default pointer-events-none'}`}
            >
              <Star
                size={size}
                style={
                  filled
                    ? { color: '#FDEF42', fill: '#FDEF42' }
                    : half
                    ? { color: '#FDEF42', fill: 'rgba(253,239,66,0.4)' }
                    : { color: '#D1D5DB' }
                }
              />
            </button>
          );
        })}
      </div>
      {showValue && <span className="text-sm font-semibold ml-1" style={{ color: '#374151' }}>{rating.toFixed(1)}</span>}
      {count !== undefined && <span className="text-sm text-gray-500">{`(${count})`}</span>}
    </div>
  );
}
