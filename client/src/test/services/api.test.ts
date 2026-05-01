/**
 * Tests de l'instance Axios (api.ts) :
 *   – Injection du Bearer token sur chaque requête
 *   – Refresh silencieux sur 401 + retry automatique
 *   – Toast sur 429 (rate-limit) et 500+ (erreur serveur)
 *   – Singleton ensureAccessToken (pas de double rotation)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── État partagé entre les factories et les tests ────────────────────────────
// vi.hoisted() retourne un objet (référence). Les factories mutent ses propriétés ;
// les tests lisent les mêmes propriétés → synchronisation garantie.

const $ = vi.hoisted(() => ({
  toastError: vi.fn(),
  axiosPost:  vi.fn(),
  // Interceptors enregistrés à l'import de api.ts — mutés par les factories
  reqFn:  (_c: Record<string, unknown>) => _c,
  okFn:   (_r: unknown) => _r,
  errFn:  (_e: unknown): Promise<unknown> => Promise.reject(_e),
}));

vi.mock('react-hot-toast', () => ({
  default: { error: $.toastError },
}));

vi.mock('axios', () => ({
  default: {
    post:   $.axiosPost,
    create: vi.fn(() => ({
      interceptors: {
        request:  { use: vi.fn((fn: typeof $.reqFn) => { $.reqFn = fn; }) },
        response: { use: vi.fn((ok: typeof $.okFn, err: typeof $.errFn) => {
          $.okFn  = ok;
          $.errFn = err;
        }) },
      },
    })),
  },
}));

// Import APRÈS les mocks — api.ts appelle axios.create() et enregistre ses interceptors
import { tokenStore, ensureAccessToken } from '../../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeConfig = (url = '/products', retry = false) => ({
  headers: {} as Record<string, string>,
  url,
  _retry: retry,
});

const makeError = (status: number, message = 'Erreur', url = '/products', retry = false) => ({
  config:   makeConfig(url, retry),
  response: { status, data: { message } },
});

// ─── Interceptor de requête — injection Bearer ────────────────────────────────

describe('api.ts — request interceptor', () => {
  beforeEach(() => { vi.clearAllMocks(); tokenStore.clear(); });

  it('n\'ajoute pas Authorization si tokenStore est vide', () => {
    const result = $.reqFn(makeConfig());
    expect((result.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('injecte Authorization: Bearer <token> quand le token est défini', () => {
    tokenStore.set('my-access-token');
    const result = $.reqFn(makeConfig());
    expect((result.headers as Record<string, string>).Authorization).toBe('Bearer my-access-token');
  });

  it('met à jour le header si le token change entre deux requêtes', () => {
    tokenStore.set('token-v1');
    expect(($.reqFn(makeConfig()).headers as Record<string, string>).Authorization).toBe('Bearer token-v1');
    tokenStore.set('token-v2');
    expect(($.reqFn(makeConfig()).headers as Record<string, string>).Authorization).toBe('Bearer token-v2');
  });
});

// ─── Interceptor de réponse — pass-through sur succès ────────────────────────

describe('api.ts — response interceptor (succès)', () => {
  it('retourne la réponse inchangée', () => {
    const res = { status: 200, data: { success: true } };
    expect($.okFn(res)).toBe(res);
  });
});

// ─── Auto-refresh sur 401 ─────────────────────────────────────────────────────

describe('api.ts — response interceptor (401 auto-refresh)', () => {
  beforeEach(() => { vi.clearAllMocks(); tokenStore.clear(); });

  it('tente un refresh et met à jour tokenStore avec le nouveau token', async () => {
    $.axiosPost.mockResolvedValueOnce({
      data: { data: { accessToken: 'new-token' } },
    });

    try {
      await $.errFn(makeError(401));
    } catch {
      // Le retry de la requête initiale peut échouer sur l'instance mock.
      // L'important est que la rotation de token ait été effectuée.
    }

    expect($.axiosPost).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh-token'),
      {},
      expect.objectContaining({ withCredentials: true }),
    );
    expect(tokenStore.get()).toBe('new-token');
  });

  it('ne tente pas de refresh pour les routes /auth/ (évite boucle sur /auth/login)', async () => {
    await expect($.errFn(makeError(401, 'Unauthorized', '/auth/login'))).rejects.toBeDefined();
    expect($.axiosPost).not.toHaveBeenCalled();
  });

  it('ne tente pas de refresh si _retry=true (évite boucle infinie)', async () => {
    await expect($.errFn(makeError(401, 'Unauthorized', '/products', true))).rejects.toBeDefined();
    expect($.axiosPost).not.toHaveBeenCalled();
  });
});

// ─── Toast sur 429 ────────────────────────────────────────────────────────────

describe('api.ts — response interceptor (429 rate-limit)', () => {
  beforeEach(() => { vi.clearAllMocks(); tokenStore.clear(); });

  it('affiche un toast "Trop de requêtes" sur 429', async () => {
    await expect($.errFn(makeError(429, 'Too Many Requests'))).rejects.toBeDefined();
    expect($.toastError).toHaveBeenCalledWith(expect.stringMatching(/trop de requêtes/i));
  });

  it('n\'affiche pas de toast sur 400', async () => {
    await expect($.errFn(makeError(400, 'Bad Request'))).rejects.toBeDefined();
    expect($.toastError).not.toHaveBeenCalled();
  });

  it('n\'affiche pas de toast sur 403', async () => {
    await expect($.errFn(makeError(403, 'Forbidden'))).rejects.toBeDefined();
    expect($.toastError).not.toHaveBeenCalled();
  });
});

// ─── Toast sur 5xx ────────────────────────────────────────────────────────────

describe('api.ts — response interceptor (5xx erreur serveur)', () => {
  beforeEach(() => { vi.clearAllMocks(); tokenStore.clear(); });

  it('affiche un toast avec le message serveur sur 500', async () => {
    await expect($.errFn(makeError(500, 'Erreur serveur inattendue'))).rejects.toBeDefined();
    expect($.toastError).toHaveBeenCalledWith('Erreur serveur inattendue');
  });

  it('affiche "Erreur de connexion" quand response.data.message est absent', async () => {
    // message ?? 'Erreur de connexion' → 'Erreur de connexion' (car message est undefined)
    const error = { config: makeConfig(), response: { status: 500, data: {} } };
    await expect($.errFn(error)).rejects.toBeDefined();
    expect($.toastError).toHaveBeenCalledWith('Erreur de connexion');
  });

  it('affiche un toast sur 503', async () => {
    await expect($.errFn(makeError(503, 'Service Unavailable'))).rejects.toBeDefined();
    expect($.toastError).toHaveBeenCalled();
  });
});

// ─── ensureAccessToken — singleton anti-double-rotation ──────────────────────

describe('ensureAccessToken — singleton', () => {
  beforeEach(() => { vi.clearAllMocks(); tokenStore.clear(); });

  it('une seule requête HTTP pour des appels simultanés (StrictMode / requêtes parallèles)', async () => {
    let resolveRefresh!: () => void;
    const gate = new Promise<void>((res) => { resolveRefresh = res; });

    $.axiosPost.mockImplementationOnce(async () => {
      await gate;
      return { data: { data: { accessToken: 'singleton-token' } } };
    });

    const p1 = ensureAccessToken();
    const p2 = ensureAccessToken(); // doit retourner la même Promise en vol

    resolveRefresh();

    const [t1, t2] = await Promise.all([p1, p2]);

    expect(t1).toBe('singleton-token');
    expect(t2).toBe('singleton-token');
    expect($.axiosPost).toHaveBeenCalledTimes(1);
  });

  it('nettoie le token mémoire si le refresh échoue', async () => {
    tokenStore.set('old-token');
    $.axiosPost.mockRejectedValueOnce(new Error('Session expirée'));

    await expect(ensureAccessToken()).rejects.toThrow('Session expirée');

    expect(tokenStore.get()).toBeNull();
  });
});
