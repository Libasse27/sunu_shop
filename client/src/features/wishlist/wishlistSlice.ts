import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { Product } from '../../types/product.types';
import type { RootState } from '../../store/store';

interface WishlistState {
  items: string[];       // IDs persistés en localStorage
  products: Product[];   // objets complets pour WishlistPage (mémoire seulement)
  syncing: boolean;
}

const initialState: WishlistState = {
  items: JSON.parse(localStorage.getItem('wishlist') || '[]'),
  products: [],
  syncing: false,
};

/**
 * Synchronise depuis le serveur à la connexion.
 * Retourne des produits peuplés → on extrait les IDs ET on stocke les objets
 * pour éviter un second appel depuis WishlistPage.
 */
export const syncWishlist = createAsyncThunk('wishlist/sync', async () => {
  const { data } = await api.get('/wishlist');
  return (data.data as Product[]) || [];
});

/**
 * Toggle wishlist avec sync serveur optimiste.
 * La mise à jour Redux s'applique en `pending` pour un retour immédiat.
 * En cas d'erreur serveur, `rejected` annule le toggle.
 *
 * `product` est toujours requis pour permettre le rollback sans état perdu.
 */
export const toggleWishlistAsync = createAsyncThunk(
  'wishlist/toggleAsync',
  async (
    { productId }: { productId: string; product?: Product },
    { getState }
  ) => {
    const { wishlist } = getState() as RootState;
    const wasWished = wishlist.items.includes(productId);
    if (wasWished) {
      await api.delete(`/wishlist/${productId}`);
    } else {
      await api.post(`/wishlist/${productId}`);
    }
  }
);

const saveItems = (items: string[]) =>
  localStorage.setItem('wishlist', JSON.stringify(items));

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    setWishlist(state, action: PayloadAction<string[]>) {
      state.items = action.payload;
      saveItems(state.items);
    },
    clearWishlist(state) {
      state.items = [];
      state.products = [];
      saveItems([]);
    },
  },
  extraReducers: (builder) => {
    builder
      // ── syncWishlist ──────────────────────────────────────────────────────
      .addCase(syncWishlist.pending, (state) => {
        state.syncing = true;
      })
      .addCase(syncWishlist.fulfilled, (state, action) => {
        state.syncing = false;
        const serverProducts = action.payload;
        const serverIds = serverProducts.map((p) => p._id);
        // Union locale + serveur (favoris ajoutés hors-ligne)
        const merged = [...new Set([...state.items, ...serverIds])];
        state.items = merged;
        state.products = serverProducts;
        saveItems(merged);
      })
      .addCase(syncWishlist.rejected, (state) => {
        state.syncing = false;
      })

      // ── toggleWishlistAsync ───────────────────────────────────────────────
      // pending → toggle optimiste immédiat
      .addCase(toggleWishlistAsync.pending, (state, action) => {
        const { productId, product } = action.meta.arg;
        const idx = state.items.indexOf(productId);
        if (idx >= 0) {
          state.items.splice(idx, 1);
          state.products = state.products.filter((p) => p._id !== productId);
        } else {
          state.items.push(productId);
          if (product) state.products.push(product);
        }
        saveItems(state.items);
      })
      // rejected → rollback du toggle optimiste
      .addCase(toggleWishlistAsync.rejected, (state, action) => {
        const { productId, product } = action.meta.arg;
        const idx = state.items.indexOf(productId);
        if (idx >= 0) {
          // pending avait ajouté → on retire
          state.items.splice(idx, 1);
          state.products = state.products.filter((p) => p._id !== productId);
        } else {
          // pending avait retiré → on remet
          state.items.push(productId);
          if (product) state.products.push(product);
        }
        saveItems(state.items);
      });
  },
});

export const { setWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
