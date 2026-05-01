import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Tag, X, Loader2, CheckCircle } from 'lucide-react';
import { RootState } from '../../store/store';
import { applyCoupon, removeCoupon, selectCartTotal } from '../../features/cart/cartSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/formatPrice';
import { getApiError } from '../../utils/getApiError';

export default function CouponInput() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const coupon = useSelector((state: RootState) => state.cart.coupon);
  const orderTotal = useSelector(selectCartTotal);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setIsLoading(true);
    try {
      const { data } = await api.post('/coupons/validate', {
        code: code.trim().toUpperCase(),
        orderTotal,
      });
      const couponData = data.data;
      dispatch(applyCoupon({
        code: couponData.code,
        discount: couponData.discount,
        type: couponData.type,
      }));
      toast.success(`Code promo "${couponData.code}" appliqué ! −${formatPrice(couponData.discount)}`);
      setCode('');
    } catch (err: unknown) {
      toast.error(getApiError(err, 'Code promo invalide'));
    }
    setIsLoading(false);
  };

  if (coupon) {
    return (
      <div
        className="flex items-center justify-between rounded-lg px-3 py-2"
        style={{ background: 'rgba(0,154,68,0.08)', border: '1px solid rgba(0,154,68,0.25)' }}
      >
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="shrink-0" style={{ color: '#009A44' }} />
          <div>
            <span className="font-bold text-sm" style={{ color: '#009A44', letterSpacing: '0.05em' }}>{coupon.code}</span>
            <span className="text-sm ml-2 font-semibold" style={{ color: '#007A35' }}>
              −{formatPrice(coupon.discount)} économisé
            </span>
          </div>
        </div>
        <button
          onClick={() => dispatch(removeCoupon())}
          className="p-1 border-0 bg-transparent rounded"
          style={{ color: 'rgba(0,154,68,0.6)' }}
          aria-label="Retirer le code promo"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="flex gap-2">
      <div className="relative flex-1">
        <Tag size={15} className="absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#FCD116' }} />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CODE PROMO"
          className="input-field w-full text-sm uppercase font-semibold"
          style={{ paddingLeft: '36px', letterSpacing: '0.1em' }}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !code.trim()}
        className="btn-outline text-sm px-3 shrink-0"
        style={{ opacity: isLoading || !code.trim() ? 0.4 : 1 }}
      >
        {isLoading
          ? <Loader2 size={15} className="animate-spin" />
          : 'Appliquer'
        }
      </button>
    </form>
  );
}
