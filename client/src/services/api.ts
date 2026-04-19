import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Stockage en mémoire du token d'accès.
 * Sécurité : ne pas stocker l'accessToken en localStorage (vulnérable XSS).
 * Le refreshToken reste en cookie HttpOnly (géré automatiquement par le navigateur).
 */
let _accessToken: string | null = null;

export const tokenStore = {
  get: (): string | null => _accessToken,
  set: (token: string | null): void => { _accessToken = token; },
  clear: (): void => { _accessToken = null; },
};

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Injecter le token depuis la mémoire (pas localStorage)
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Singleton de refresh — garantit qu'une seule rotation est en cours à la fois.
 *
 * Problème résolu : React StrictMode monte les composants 2× en dev → deux appels
 * simultanés à /auth/refresh-token avec le MÊME cookie → le serveur tourne le token
 * sur le premier → le second échoue (token DB ≠ cookie). Même risque si plusieurs
 * requêtes non authentifiées partent en parallèle et déclenchent chacune le refresh.
 *
 * Solution : toutes les demandes de refresh partagent la même Promise. Une seule
 * requête HTTP part ; tous les appelants reçoivent le même token résultant.
 */
let _refreshPromise: Promise<string> | null = null;

export const ensureAccessToken = (): Promise<string> => {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = axios
    .post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true })
    .then(({ data }) => {
      const token: string = data.data.accessToken;
      tokenStore.set(token);
      return token;
    })
    .catch((err) => {
      // Nettoyage local — la redirection est gérée par l'appelant
      tokenStore.clear();
      throw err;
    })
    .finally(() => {
      _refreshPromise = null;
    });

  return _refreshPromise;
};

// Auto-refresh sur 401 + gestion centralisée des erreurs serveur
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status as number | undefined;
    const message =
      (error.response?.data as { message?: string })?.message ?? 'Erreur de connexion';

    // Rafraîchissement silencieux du token sur 401 — ne pas afficher de toast ici
    if (
      status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.startsWith('/auth/')
    ) {
      originalRequest._retry = true;
      try {
        const newToken = await ensureAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        // Refresh échoué — session expirée, redirection vers la connexion
        localStorage.removeItem('user');
        window.location.href = '/connexion';
      }
    }

    // Trop de requêtes (rate-limit) — feedback utilisateur
    if (status === 429) {
      toast.error('Trop de requêtes, veuillez patienter quelques instants');
    } else if (status !== undefined && status >= 500) {
      // Erreur serveur inattendue — le composant n'a pas à gérer ce cas
      toast.error(message || 'Erreur serveur, veuillez réessayer');
    }
    // 401 / 403 / autres 4xx → le composant appelant gère son propre feedback

    return Promise.reject(error);
  }
);

export default api;
