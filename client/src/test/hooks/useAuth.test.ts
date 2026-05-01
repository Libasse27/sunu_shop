import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import { useAuth } from '../../hooks/useAuth';
import { tokenStore } from '../../services/api';

// ─── Mock axios ───────────────────────────────────────────────────────────────
// useAuth → authSlice thunks → axios directement (pas via api.ts)
vi.mock('axios', () => {
  const mockAxios: any = {
    post:   vi.fn(),
    create: vi.fn(),
    interceptors: {
      request:  { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  mockAxios.create = vi.fn(() => mockAxios);
  return { default: mockAxios };
});

import axios from 'axios';
const mockAxios = axios as { post: ReturnType<typeof vi.fn> };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeStore = (preloaded?: Record<string, unknown>) =>
  configureStore({
    reducer: combineReducers({ auth: authReducer }),
    preloadedState: preloaded,
  });

type TestStore = ReturnType<typeof makeStore>;

const wrapper = (store: TestStore) =>
  ({ children }: { children: ReactNode }) =>
    createElement(Provider, { store }, children);

const mockUser = {
  id: 'user-123',
  firstName: 'Moussa',
  lastName: 'Diallo',
  email: 'moussa@test.sn',
  role: 'client' as const,
  isVerified: true,
};

const mockAdmin = { ...mockUser, id: 'admin-456', role: 'admin' as const };
const mockSuperadmin = { ...mockUser, id: 'super-789', role: 'superadmin' as const };

// ─── isAuthenticated ──────────────────────────────────────────────────────────

describe('useAuth — isAuthenticated', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); tokenStore.clear(); });

  it('false quand aucun utilisateur en session', () => {
    const store = makeStore({ auth: { user: null, isLoading: false, error: null } });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('true quand un utilisateur est chargé dans le store', () => {
    const store = makeStore({ auth: { user: mockUser, isLoading: false, error: null } });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });
});

// ─── isAdmin ──────────────────────────────────────────────────────────────────

describe('useAuth — isAdmin', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); tokenStore.clear(); });

  it('false pour un utilisateur role=client', () => {
    const store = makeStore({ auth: { user: mockUser, isLoading: false, error: null } });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });
    expect(result.current.isAdmin).toBe(false);
  });

  it('true pour un utilisateur role=admin', () => {
    const store = makeStore({ auth: { user: mockAdmin, isLoading: false, error: null } });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });
    expect(result.current.isAdmin).toBe(true);
  });

  it('true pour un utilisateur role=superadmin', () => {
    const store = makeStore({ auth: { user: mockSuperadmin, isLoading: false, error: null } });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });
    expect(result.current.isAdmin).toBe(true);
  });

  it('false quand user est null', () => {
    const store = makeStore({ auth: { user: null, isLoading: false, error: null } });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });
    expect(result.current.isAdmin).toBe(false);
  });
});

// ─── login ────────────────────────────────────────────────────────────────────

describe('useAuth — login', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); tokenStore.clear(); });

  it('dispatche loginUser et met à jour l\'état après succès', async () => {
    mockAxios.post.mockResolvedValueOnce({
      data: { data: { user: mockUser, accessToken: 'access-token' } },
    });

    const store = makeStore();
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

    await act(async () => {
      await result.current.login('moussa@test.sn', 'Pass123!');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(tokenStore.get()).toBe('access-token');
  });

  it('stocke l\'erreur si les identifiants sont invalides', async () => {
    mockAxios.post.mockRejectedValueOnce({
      response: { data: { message: 'Identifiants invalides' } },
    });

    const store = makeStore();
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

    await act(async () => {
      await result.current.login('bad@test.sn', 'wrong');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('Identifiants invalides');
    expect(result.current.isAuthenticated).toBe(false);
  });
});

// ─── register ─────────────────────────────────────────────────────────────────

describe('useAuth — register', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); tokenStore.clear(); });

  it('dispatche registerUser et ouvre une session après succès', async () => {
    mockAxios.post.mockResolvedValueOnce({
      data: { data: { user: mockUser, accessToken: 'reg-token' } },
    });

    const store = makeStore();
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

    await act(async () => {
      await result.current.register({
        firstName: 'Moussa',
        lastName: 'Diallo',
        email: 'moussa@test.sn',
        password: 'Pass123!',
        phone: '+221771234567',
      });
    });

    expect(result.current.user).toEqual(mockUser);
    expect(tokenStore.get()).toBe('reg-token');
  });

  it('stocke l\'erreur si l\'email est déjà utilisé', async () => {
    mockAxios.post.mockRejectedValueOnce({
      response: { data: { message: 'Email déjà utilisé' } },
    });

    const store = makeStore();
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

    await act(async () => {
      await result.current.register({
        firstName: 'X',
        lastName: 'Y',
        email: 'existing@test.sn',
        password: 'pass',
      });
    });

    expect(result.current.error).toBe('Email déjà utilisé');
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe('useAuth — logout', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); tokenStore.clear(); });

  it('vide immédiatement l\'état Redux (optimiste pending)', () => {
    mockAxios.post.mockResolvedValue({ data: {} });
    tokenStore.set('active-token');
    const store = makeStore({ auth: { user: mockUser, isLoading: false, error: null } });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

    act(() => {
      result.current.logout(); // sans await
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('efface le token mémoire et localStorage après la déconnexion', async () => {
    mockAxios.post.mockResolvedValueOnce({ data: {} });
    tokenStore.set('active-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    const store = makeStore({ auth: { user: mockUser, isLoading: false, error: null } });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

    await act(async () => {
      await result.current.logout();
    });

    expect(tokenStore.get()).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});

// ─── clearError ───────────────────────────────────────────────────────────────

describe('useAuth — clearError', () => {
  it('remet error à null', () => {
    const store = makeStore({ auth: { user: null, isLoading: false, error: 'Erreur précédente' } });
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(store) });

    act(() => { result.current.clearError(); });

    expect(result.current.error).toBeNull();
  });
});
