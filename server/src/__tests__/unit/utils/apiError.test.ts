import { ApiError } from '../../../utils/ApiError';

describe('ApiError', () => {
  it('crée une erreur 400', () => {
    const err = ApiError.badRequest('Données invalides');
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Données invalides');
    expect(err.isOperational).toBe(true);
  });

  it('crée une erreur 401 avec message par défaut', () => {
    const err = ApiError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Non autorisé');
  });

  it('crée une erreur 403', () => {
    const err = ApiError.forbidden('Accès refusé');
    expect(err.statusCode).toBe(403);
  });

  it('crée une erreur 404', () => {
    const err = ApiError.notFound('Produit non trouvé');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Produit non trouvé');
  });

  it('crée une erreur 409', () => {
    const err = ApiError.conflict('Email déjà utilisé');
    expect(err.statusCode).toBe(409);
  });

  it('crée une erreur 500 non-opérationnelle', () => {
    const err = ApiError.internal('Erreur inattendue');
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(false);
  });

  it('hérite de Error', () => {
    const err = ApiError.notFound();
    expect(err).toBeInstanceOf(Error);
  });
});
