import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem } from '../../types/cart.types';

interface CartState {
  items: CartItem[];
  coupon: { code: string; discount: number; type?: string } | null;
  drawerOpen: boolean;
}

const loadCart = (): CartItem[] => {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch {
    return [];
  }
};

const initialState: CartState = {
  items: loadCart(),
  coupon: null,
  drawerOpen: false,
};

const saveCart = (items: CartItem[]) => {
  localStorage.setItem('cart', JSON.stringify(items));
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find(
        (item) => item._id === action.payload._id && item.variant?.value === action.payload.variant?.value
      );
      if (existing) {
        existing.quantity = Math.min(existing.quantity + action.payload.quantity, existing.stock);
      } else {
        state.items.push(action.payload);
      }
      saveCart(state.items);
    },
    removeFromCart(state, action: PayloadAction<{ id: string; variant?: string }>) {
      state.items = state.items.filter(
        (item) => !(item._id === action.payload.id && item.variant?.value === action.payload.variant)
      );
      saveCart(state.items);
    },
    updateQuantity(state, action: PayloadAction<{ id: string; variant?: string; quantity: number }>) {
      const item = state.items.find(
        (i) => i._id === action.payload.id && i.variant?.value === action.payload.variant
      );
      if (item) {
        item.quantity = Math.max(1, Math.min(action.payload.quantity, item.stock));
      }
      saveCart(state.items);
    },
    clearCart(state) {
      state.items = [];
      state.coupon = null;
      localStorage.removeItem('cart');
    },
    applyCoupon(state, action: PayloadAction<{ code: string; discount: number; type?: string }>) {
      state.coupon = action.payload;
    },
    removeCoupon(state) {
      state.coupon = null;
    },
    openCartDrawer(state) {
      state.drawerOpen = true;
    },
    closeCartDrawer(state) {
      state.drawerOpen = false;
    },
  },
});

// Selectors
export const selectCartTotal = (state: { cart: CartState }) =>
  // finalPrice inclut le priceModifier de la variante (ex: +5 000 FCFA pour 256 Go)
  state.cart.items.reduce((sum, item) => sum + (item.finalPrice ?? item.price) * item.quantity, 0);

export const selectCartCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectCartDrawerOpen = (state: { cart: CartState }) => state.cart.drawerOpen;

export const { addToCart, removeFromCart, updateQuantity, clearCart, applyCoupon, removeCoupon, openCartDrawer, closeCartDrawer } = cartSlice.actions;
export default cartSlice.reducer;
