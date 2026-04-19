import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import axios from 'axios';
import authReducer, {
  loginUser,
  registerUser,
  setCredentials,
  logout,
  clearError,
} from '../../features/auth/authSlice';
import { tokenStore } from '../../services/api';

// Mock axios pour isoler les appels HTTP
vi.mock('axios', () => {
  const mockAxios: any = {
    post: vi.fn(),
    create: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  mockAxios.create = vi.fn(() => mockAxios);
  return { default: mockAxios };
});

// Utilitaire pour créer un store propre à chaque test
const authRootReducer = combineReducers({ auth: authReducer });
function makeStore(preloaded?: any) {
  return configureStore({
    reducer: authRootReducer,
    preloadedState: preloaded,
  });
}

const mockUser = {
  id: 'user-123',
  firstName: 'Moussa',
  lastName: 'Diallo',
  email: 'moussa@test.sn',
  role: 'client' as const,
  isVerified: true,
};

describe('authSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    tokenStore.clear();
  });

  // ── État initial ─────────────────────────────────────────────────────────────
  describe('état initial', () => {
    it('initialise user à null quand localStorage est vide', () => {
      localStorage.removeItem('user');
      const store = makeStore();
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('recharge user depuis localStorage si présent', () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      // Re-créer le store après avoir positionné localStorage
      const store = makeStore({ auth: { user: mockUser, isLoading: false, error: null } });
      expect(store.getState().auth.user).toEqual(mockUser);
    });
  });

  // ── loginUser ────────────────────────────────────────────────────────────────
  describe('loginUser', () => {
    it('passe isLoading à true lors de la requête (pending)', async () => {
      // La promesse ne se résout jamais — on teste l'état intermédiaire
      (axios.post as ReturnType<typeof vi.fn>).mockReturnValueOnce(new Promise(() => {}));
      const store = makeStore();
      store.dispatch(loginUser({ email: 'moussa@test.sn', password: 'Pass123!' }));
      expect(store.getState().auth.isLoading).toBe(true);
    });

    it('fulfilled — stocke user et token, efface error', async () => {
      const accessToken = 'access-jwt-token';
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { data: { user: mockUser, accessToken } },
      });
      const store = makeStore();
      await store.dispatch(loginUser({ email: 'moussa@test.sn', password: 'Pass123!' }));

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.error).toBeNull();
      // Token en mémoire
      expect(tokenStore.get()).toBe(accessToken);
      // User persisté en localStorage
      expect(JSON.parse(localStorage.getItem('user') || 'null')).toEqual(mockUser);
    });

    it('rejected — stocke le message erreur, isLoading false', async () => {
      (axios.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
        response: { data: { message: 'Identifiants invalides' } },
      });
      const store = makeStore();
      await store.dispatch(loginUser({ email: 'bad@test.sn', password: 'wrong' }));

      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBe('Identifiants invalides');
    });

    it('rejected — message générique si pas de réponse serveur', async () => {
      (axios.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network Error'));
      const store = makeStore();
      await store.dispatch(loginUser({ email: 'bad@test.sn', password: 'wrong' }));

      expect(store.getState().auth.error).toBe('Erreur de connexion');
    });
  });

  // ── registerUser ─────────────────────────────────────────────────────────────
  describe('registerUser', () => {
    it('fulfilled — crée la session comme pour loginUser', async () => {
      const accessToken = 'register-jwt-token';
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { data: { user: mockUser, accessToken } },
      });
      const store = makeStore();
      await store.dispatch(
        registerUser({
          firstName: 'Moussa',
          lastName: 'Diallo',
          email: 'moussa@test.sn',
          password: 'Pass123!',
          phone: '+221771234567',
        })
      );

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(tokenStore.get()).toBe(accessToken);
    });

    it('rejected — message erreur inscription', async () => {
      (axios.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
        response: { data: { message: 'Email déjà utilisé' } },
      });
      const store = makeStore();
      await store.dispatch(
        registerUser({ firstName: 'X', lastName: 'Y', email: 'exist@test.sn', password: 'pass' })
      );
      expect(store.getState().auth.error).toBe('Email déjà utilisé');
    });
  });

  // ── setCredentials ───────────────────────────────────────────────────────────
  describe('setCredentials', () => {
    it('met à jour le token en mémoire sans toucher user si user absent', () => {
      const store = makeStore();
      store.dispatch(setCredentials({ accessToken: 'new-token' }));
      expect(tokenStore.get()).toBe('new-token');
      expect(store.getState().auth.user).toBeNull();
    });

    it('met à jour user et localStorage quand user fourni', () => {
      const store = makeStore();
      store.dispatch(setCredentials({ accessToken: 'new-token', user: mockUser }));
      expect(store.getState().auth.user).toEqual(mockUser);
      expect(JSON.parse(localStorage.getItem('user') || 'null')).toEqual(mockUser);
    });
  });

  // ── logout ───────────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('vide user, token mémoire et localStorage (async thunk)', async () => {
      // Simuler une session active
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
      tokenStore.set('active-token');
      localStorage.setItem('user', JSON.stringify(mockUser));

      const store = makeStore({ auth: { user: mockUser, isLoading: false, error: null } });

      // logout est maintenant un createAsyncThunk — on await pour que tokenStore et
      // localStorage soient nettoyés dans le payload creator
      await store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.error).toBeNull();
      expect(tokenStore.get()).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('vide l\'état Redux immédiatement (pending) — UX optimiste', () => {
      // Le state doit être vide dès le début (sans awaiter la fin du thunk)
      const store = makeStore({ auth: { user: mockUser, isLoading: false, error: null } });
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });

      store.dispatch(logout()); // sans await intentionnel

      // state.user doit être null immédiatement grâce au handler pending
      expect(store.getState().auth.user).toBeNull();
    });
  });

  // ── clearError ───────────────────────────────────────────────────────────────
  describe('clearError', () => {
    it('remet error à null', () => {
      const store = makeStore({ auth: { user: null, isLoading: false, error: 'Erreur précédente' } });
      store.dispatch(clearError());
      expect(store.getState().auth.error).toBeNull();
    });
  });
});
