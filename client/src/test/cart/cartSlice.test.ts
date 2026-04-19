import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import cartReducer, {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  applyCoupon,
  removeCoupon,
  selectCartTotal,
  selectCartCount,
} from '../../features/cart/cartSlice';
import { CartItem } from '../../types/cart.types';

function makeStore(items: CartItem[] = [], coupon: any = null) {
  return configureStore({
    reducer: { cart: cartReducer },
    preloadedState: {
      cart: { items, coupon, drawerOpen: false },
    },
  });
}

// Produits de test représentatifs du catalogue Sunu Shop
const laptop: CartItem = {
  _id: 'prod-laptop-001',
  name: 'HP 15s Intel Core i5',
  slug: 'hp-15s-intel-core-i5',
  price: 450000,
  image: '/images/laptop.jpg',
  stock: 10,
  quantity: 1,
};

const phone: CartItem = {
  _id: 'prod-phone-002',
  name: 'Samsung Galaxy A54',
  slug: 'samsung-galaxy-a54',
  price: 185000,
  image: '/images/phone.jpg',
  stock: 5,
  quantity: 2,
};

const phoneBlue: CartItem = {
  ...phone,
  variant: { name: 'Couleur', value: 'Bleu' },
};

const phoneBlack: CartItem = {
  ...phone,
  variant: { name: 'Couleur', value: 'Noir' },
};

describe('cartSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── addToCart ────────────────────────────────────────────────────────────────
  describe('addToCart', () => {
    it('ajoute un nouveau produit au panier vide', () => {
      const store = makeStore();
      store.dispatch(addToCart(laptop));
      const { items } = store.getState().cart;
      expect(items).toHaveLength(1);
      expect(items[0]._id).toBe('prod-laptop-001');
      expect(items[0].quantity).toBe(1);
    });

    it('ajoute deux produits différents', () => {
      const store = makeStore();
      store.dispatch(addToCart(laptop));
      store.dispatch(addToCart(phone));
      expect(store.getState().cart.items).toHaveLength(2);
    });

    it('incrémente la quantité si le même produit (sans variant) est ajouté', () => {
      const store = makeStore([laptop]);
      store.dispatch(addToCart({ ...laptop, quantity: 2 }));
      const { items } = store.getState().cart;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(3);
    });

    it('plafonne la quantité au stock disponible', () => {
      const store = makeStore([{ ...laptop, quantity: 9 }]);
      store.dispatch(addToCart({ ...laptop, quantity: 5 }));
      expect(store.getState().cart.items[0].quantity).toBe(10); // stock = 10
    });

    it('traite deux variantes du même produit comme des lignes distinctes', () => {
      const store = makeStore();
      store.dispatch(addToCart(phoneBlue));
      store.dispatch(addToCart(phoneBlack));
      expect(store.getState().cart.items).toHaveLength(2);
    });

    it('incrémente la bonne variante sans affecter l\'autre', () => {
      const store = makeStore([phoneBlue, phoneBlack]);
      store.dispatch(addToCart({ ...phoneBlue, quantity: 1 }));
      const { items } = store.getState().cart;
      const blue = items.find(i => i.variant?.value === 'Bleu');
      const black = items.find(i => i.variant?.value === 'Noir');
      expect(blue?.quantity).toBe(3); // 2 + 1
      expect(black?.quantity).toBe(2); // inchangé
    });

    it('persiste le panier dans localStorage', () => {
      const store = makeStore();
      store.dispatch(addToCart(laptop));
      const saved = JSON.parse(localStorage.getItem('cart') || '[]');
      expect(saved).toHaveLength(1);
    });
  });

  // ── removeFromCart ───────────────────────────────────────────────────────────
  describe('removeFromCart', () => {
    it('retire le produit ciblé', () => {
      const store = makeStore([laptop, phone]);
      store.dispatch(removeFromCart({ id: 'prod-laptop-001' }));
      const { items } = store.getState().cart;
      expect(items).toHaveLength(1);
      expect(items[0]._id).toBe('prod-phone-002');
    });

    it('ne retire que la variante ciblée', () => {
      const store = makeStore([phoneBlue, phoneBlack]);
      store.dispatch(removeFromCart({ id: phone._id, variant: 'Bleu' }));
      const { items } = store.getState().cart;
      expect(items).toHaveLength(1);
      expect(items[0].variant?.value).toBe('Noir');
    });

    it('retirer un id inexistant ne modifie pas le panier', () => {
      const store = makeStore([laptop]);
      store.dispatch(removeFromCart({ id: 'inexistant' }));
      expect(store.getState().cart.items).toHaveLength(1);
    });

    it('persiste la suppression dans localStorage', () => {
      const store = makeStore([laptop]);
      store.dispatch(removeFromCart({ id: laptop._id }));
      const saved = JSON.parse(localStorage.getItem('cart') || '[]');
      expect(saved).toHaveLength(0);
    });
  });

  // ── updateQuantity ───────────────────────────────────────────────────────────
  describe('updateQuantity', () => {
    it('met à jour la quantité du produit ciblé', () => {
      const store = makeStore([laptop]);
      store.dispatch(updateQuantity({ id: laptop._id, quantity: 4 }));
      expect(store.getState().cart.items[0].quantity).toBe(4);
    });

    it('plafonne au stock maximum', () => {
      const store = makeStore([laptop]);
      store.dispatch(updateQuantity({ id: laptop._id, quantity: 999 }));
      expect(store.getState().cart.items[0].quantity).toBe(10); // stock = 10
    });

    it('plancher à 1 (ne descend pas en dessous)', () => {
      const store = makeStore([laptop]);
      store.dispatch(updateQuantity({ id: laptop._id, quantity: 0 }));
      expect(store.getState().cart.items[0].quantity).toBe(1);
    });

    it('met à jour la bonne variante seulement', () => {
      const store = makeStore([phoneBlue, phoneBlack]);
      store.dispatch(updateQuantity({ id: phone._id, variant: 'Bleu', quantity: 4 }));
      const { items } = store.getState().cart;
      expect(items.find(i => i.variant?.value === 'Bleu')?.quantity).toBe(4);
      expect(items.find(i => i.variant?.value === 'Noir')?.quantity).toBe(2);
    });
  });

  // ── clearCart ────────────────────────────────────────────────────────────────
  describe('clearCart', () => {
    it('vide le panier et supprime localStorage', () => {
      localStorage.setItem('cart', JSON.stringify([laptop]));
      const store = makeStore([laptop], { code: 'PROMO10', discount: 5000 });
      store.dispatch(clearCart());
      const { items, coupon } = store.getState().cart;
      expect(items).toHaveLength(0);
      expect(coupon).toBeNull();
      expect(localStorage.getItem('cart')).toBeNull();
    });
  });

  // ── applyCoupon / removeCoupon ───────────────────────────────────────────────
  describe('applyCoupon', () => {
    it('stocke le coupon dans le state', () => {
      const store = makeStore();
      store.dispatch(applyCoupon({ code: 'SUNU10', discount: 10000, type: 'fixed' }));
      const { coupon } = store.getState().cart;
      expect(coupon).toEqual({ code: 'SUNU10', discount: 10000, type: 'fixed' });
    });

    it('remplace un coupon existant', () => {
      const store = makeStore([], { code: 'OLD', discount: 5000 });
      store.dispatch(applyCoupon({ code: 'NEW20', discount: 20000 }));
      expect(store.getState().cart.coupon?.code).toBe('NEW20');
    });
  });

  describe('removeCoupon', () => {
    it('supprime le coupon actif', () => {
      const store = makeStore([], { code: 'SUNU10', discount: 10000 });
      store.dispatch(removeCoupon());
      expect(store.getState().cart.coupon).toBeNull();
    });
  });

  // ── selectCartTotal ──────────────────────────────────────────────────────────
  describe('selectCartTotal', () => {
    it('retourne 0 pour un panier vide', () => {
      const store = makeStore();
      expect(selectCartTotal(store.getState())).toBe(0);
    });

    it('calcule la somme price × quantity pour chaque ligne', () => {
      // laptop: 450000 × 1 = 450000
      // phone:  185000 × 2 = 370000
      // total = 820000
      const store = makeStore([laptop, phone]);
      expect(selectCartTotal(store.getState())).toBe(820000);
    });

    it('tient compte de la quantité mise à jour', () => {
      const store = makeStore([{ ...laptop, quantity: 3 }]);
      expect(selectCartTotal(store.getState())).toBe(1350000);
    });
  });

  // ── selectCartCount ──────────────────────────────────────────────────────────
  describe('selectCartCount', () => {
    it('retourne 0 pour un panier vide', () => {
      const store = makeStore();
      expect(selectCartCount(store.getState())).toBe(0);
    });

    it('retourne la somme des quantités', () => {
      // laptop × 1 + phone × 2 = 3
      const store = makeStore([laptop, phone]);
      expect(selectCartCount(store.getState())).toBe(3);
    });

    it('compte correctement après updateQuantity', () => {
      const store = makeStore([laptop]);
      store.dispatch(updateQuantity({ id: laptop._id, quantity: 5 }));
      expect(selectCartCount(store.getState())).toBe(5);
    });
  });
});
