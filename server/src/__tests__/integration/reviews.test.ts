import request from 'supertest';
import app from '../../app';
import User from '../../models/User.model';
import Product from '../../models/Product.model';
import Category from '../../models/Category.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function registerAndLogin(userData = {}) {
  const user = {
    firstName: 'Fatou',
    lastName: 'Ba',
    email: 'fatou.ba@test.com',
    password: 'MotDePasse123!',
    phone: '+221770000010',
    ...userData,
  };
  const reg = await request(app).post('/api/v1/auth/register').send(user);
  return { token: reg.body.data.accessToken, userId: reg.body.data.user.id };
}

async function makeAdmin(userId: string) {
  await User.findByIdAndUpdate(userId, { role: 'admin' });
}

async function createProduct() {
  const category = await Category.create({
    name: 'Informatique',
    slug: 'informatique',
  });
  const product = await Product.create({
    name: 'Laptop Test',
    slug: 'laptop-test',
    sku: 'LAP-001',
    description: 'Laptop performant pour les professionnels.',
    price: 350_000,
    currency: 'XOF',
    category: category._id,
    stock: 10,
    images: [{ url: 'https://example.com/img.jpg', isPrimary: true, order: 0 }],
  });
  return product;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Reviews API', () => {
  // ─── POST /api/v1/reviews ────────────────────────────────────────────────

  describe('POST /api/v1/reviews', () => {
    it('crée un avis pour un produit — statut pending par défaut', async () => {
      const { token } = await registerAndLogin();
      const product = await createProduct();

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ product: product._id, rating: 4, comment: 'Très bon produit, livraison rapide.' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.isApproved).toBe(false);
      expect(res.body.data.rating).toBe(4);
    });

    it('rejette un avis sans être connecté — 401', async () => {
      const product = await createProduct();
      const res = await request(app)
        .post('/api/v1/reviews')
        .send({ product: product._id, rating: 5, comment: 'Super !' });
      expect(res.status).toBe(401);
    });

    it('rejette un doublon (même user + même produit) — 409', async () => {
      const { token } = await registerAndLogin();
      const product = await createProduct();
      const payload = { product: product._id, rating: 3, comment: 'Correct mais perfectible.' };

      await request(app).post('/api/v1/reviews').set('Authorization', `Bearer ${token}`).send(payload);
      const res = await request(app).post('/api/v1/reviews').set('Authorization', `Bearer ${token}`).send(payload);

      expect(res.status).toBe(409);
    });

    it('rejette une note hors de [1,5] — 400', async () => {
      const { token } = await registerAndLogin();
      const product = await createProduct();

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ product: product._id, rating: 6, comment: 'Trop de puissance !' });
      expect(res.status).toBe(400);
    });
  });

  // ─── GET /api/v1/reviews/product/:productId ──────────────────────────────

  describe('GET /api/v1/reviews/product/:productId', () => {
    it('retourne uniquement les avis approuvés', async () => {
      const { token, userId } = await registerAndLogin();
      const product = await createProduct();
      await makeAdmin(userId);

      // Créer un avis pending + un avis approuvé
      const { body: pendingBody } = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ product: product._id, rating: 5, comment: 'Excellent !' });

      await request(app)
        .patch(`/api/v1/reviews/${pendingBody.data._id}/approve`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app).get(`/api/v1/reviews/product/${product._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.every((r: { isApproved: boolean }) => r.isApproved)).toBe(true);
    });
  });

  // ─── Admin : GET /api/v1/reviews ─────────────────────────────────────────

  describe('Admin GET /api/v1/reviews', () => {
    it('retourne tous les avis avec filtre par statut', async () => {
      const { token, userId } = await registerAndLogin();
      await makeAdmin(userId);
      const product = await createProduct();

      await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ product: product._id, rating: 4, comment: 'Bon rapport qualité-prix.' });

      const res = await request(app)
        .get('/api/v1/reviews?status=pending')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((r: { status: string }) => r.status === 'pending')).toBe(true);
    });

    it('refuse l\'accès à un simple client — 403', async () => {
      const { token } = await registerAndLogin();
      const res = await request(app)
        .get('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  // ─── Admin : PATCH /api/v1/reviews/:id/approve ───────────────────────────

  describe('Admin PATCH /reviews/:id/approve', () => {
    it('approuve un avis — status=approved, isApproved=true', async () => {
      const { token, userId } = await registerAndLogin();
      await makeAdmin(userId);
      const product = await createProduct();

      const { body: reviewBody } = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ product: product._id, rating: 4, comment: 'Très satisfait !' });

      const res = await request(app)
        .patch(`/api/v1/reviews/${reviewBody.data._id}/approve`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
      expect(res.body.data.isApproved).toBe(true);
    });
  });

  // ─── Admin : PATCH /api/v1/reviews/:id/reject ────────────────────────────

  describe('Admin PATCH /reviews/:id/reject', () => {
    it('rejette un avis — status=rejected, isApproved=false', async () => {
      const { token, userId } = await registerAndLogin();
      await makeAdmin(userId);
      const product = await createProduct();

      const { body: reviewBody } = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ product: product._id, rating: 1, comment: 'Produit défectueux, déçu.' });

      const res = await request(app)
        .patch(`/api/v1/reviews/${reviewBody.data._id}/reject`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('rejected');
      expect(res.body.data.isApproved).toBe(false);
    });
  });

  // ─── DELETE /api/v1/reviews/:id ──────────────────────────────────────────

  describe('DELETE /api/v1/reviews/:id', () => {
    it('supprime son propre avis', async () => {
      const { token } = await registerAndLogin();
      const product = await createProduct();

      const { body: reviewBody } = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ product: product._id, rating: 3, comment: 'Moyen, peut mieux faire.' });

      const res = await request(app)
        .delete(`/api/v1/reviews/${reviewBody.data._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('ne peut pas supprimer l\'avis d\'un autre utilisateur — 403', async () => {
      const { token: tokenA } = await registerAndLogin({ email: 'user-a@test.com', phone: '+221770000011' });
      const { token: tokenB } = await registerAndLogin({ email: 'user-b@test.com', phone: '+221770000012' });
      const product = await createProduct();

      const { body: reviewBody } = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ product: product._id, rating: 2, comment: 'Pas très convaincu.' });

      const res = await request(app)
        .delete(`/api/v1/reviews/${reviewBody.data._id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── POST /api/v1/reviews/:id/reply ──────────────────────────────────────

  describe('Admin POST /reviews/:id/reply', () => {
    it('ajoute une réponse admin à un avis', async () => {
      const { token, userId } = await registerAndLogin();
      await makeAdmin(userId);
      const product = await createProduct();

      const { body: reviewBody } = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ product: product._id, rating: 4, comment: 'Bon produit !' });

      const res = await request(app)
        .post(`/api/v1/reviews/${reviewBody.data._id}/reply`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'Merci pour votre retour ! Nous sommes ravis que vous soyez satisfait.' });

      expect(res.status).toBe(200);
      expect(res.body.data.adminReply).toBeDefined();
      expect(res.body.data.adminReply.text).toContain('ravis');
    });
  });
});
