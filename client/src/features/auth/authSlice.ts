import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { User } from '../../types/user.types';
import { tokenStore, ensureAccessToken } from '../../services/api';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  // user persiste en localStorage pour afficher le nom/avatar après rechargement
  // sans attendre le refresh-token silencieux
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isLoading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, credentials, { withCredentials: true });
      return data.data;
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Erreur de connexion';
      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    userData: { firstName: string; lastName: string; email: string; password: string; phone?: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/register`, userData, { withCredentials: true });
      return data.data;
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur d'inscription";
      return rejectWithValue(message);
    }
  }
);

/**
 * Restaure silencieusement l'accessToken depuis le cookie refreshToken au démarrage.
 * Utilise le singleton `ensureAccessToken` pour éviter les doubles rotations causées
 * par React StrictMode (double-mount) ou des requêtes parallèles.
 */
export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = await ensureAccessToken();
      return { accessToken };
    } catch {
      return rejectWithValue(null);
    }
  }
);

/**
 * Déconnexion asynchrone : vide l'état Redux immédiatement (pending)
 * puis invalide le refreshToken côté serveur (best-effort).
 * Sépare les effets de bord HTTP du reducer synchrone.
 */
export const logoutUser = createAsyncThunk('auth/logout', async () => {
  const token = tokenStore.get();
  // Nettoyage local (synchrone, avant await)
  tokenStore.clear();
  localStorage.removeItem('user');
  // Invalidation serveur — best-effort, ne bloque pas la déconnexion
  if (token) {
    await axios.post(`${API_URL}/auth/logout`, {}, {
      withCredentials: true,
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ accessToken: string; user?: User }>) {
      // Token en mémoire uniquement — PAS en localStorage (sécurité XSS)
      tokenStore.set(action.payload.accessToken);
      if (action.payload.user) {
        state.user = action.payload.user;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      }
    },
    setSocialCredentials(state, action: PayloadAction<{ accessToken: string; user: User }>) {
      tokenStore.set(action.payload.accessToken);
      state.user = action.payload.user;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        // Token en mémoire uniquement
        tokenStore.set(action.payload.accessToken);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(registerUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        tokenStore.set(action.payload.accessToken);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Vide l'état dès le début du logout (pending) — UX optimiste
      .addCase(logoutUser.pending, (state) => {
        state.user = null;
        state.error = null;
        state.isLoading = false;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        tokenStore.set(action.payload.accessToken);
        if (action.payload.user) {
          state.user = action.payload.user;
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        }
      })
      .addCase(restoreSession.rejected, (state) => {
        // Cookie expiré ou absent — déconnexion propre sans redirection forcée.
        // L'utilisateur verra la page normale ; les routes protégées (PrivateRoute)
        // le redirigeront vers /connexion si nécessaire.
        state.user = null;
        tokenStore.clear();
        localStorage.removeItem('user');
      });
  },
});

export const { setCredentials, setSocialCredentials, clearError } = authSlice.actions;
// Alias rétrocompatible : tous les dispatch(logout()) existants continuent de fonctionner
export const logout = logoutUser;
export default authSlice.reducer;
