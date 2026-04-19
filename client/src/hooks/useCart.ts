import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { addToCart, removeFromCart, updateQuantity, clearCart, selectCartTotal, selectCartCount } from '../features/cart/cartSlice';
import { CartItem } from '../types/cart.types';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../utils/constants';

export function useCart() {
  const dispatch = useDispatch();
  const { items, coupon } = useSelector((state: RootState) => state.cart);
  const subtotal = useSelector(selectCartTotal);
  const count = useSelector(selectCartCount);
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const discount = coupon?.discount || 0;
  const total = subtotal + shippingCost - discount;

  return {
    items,
    count,
    subtotal,
    shippingCost,
    discount,
    total,
    coupon,
    add: (item: CartItem) => dispatch(addToCart(item)),
    remove: (id: string, variant?: string) => dispatch(removeFromCart({ id, variant })),
    update: (id: string, quantity: number, variant?: string) => dispatch(updateQuantity({ id, variant, quantity })),
    clear: () => dispatch(clearCart()),
    isEmpty: items.length === 0,
    freeShippingRemaining: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
  };
}
