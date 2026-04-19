import request from 'supertest';
import app from '../../app';
import Category from '../../models/Category.model';
import Product from '../../models/Product.model';
import User from '../../models/User.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const createAdminAndLogin = async () => {
  const admin = await User.create({
    firstName: 'Admin',
    lastName: 'Test',
    email: 'admin@test.com',
    password: 'AdminPass123!',
    role: 'admin',
    isActive: true,
  });
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'AdminPass123!' });
  return { admin, token: loginRes.body.data.accessToken };
};

const createCategory = async () => {
  return Category.create({
    name: 'Informatique',
    slug: 'informatique',
    level: 0,
    isActive: true,
  });
};

const makeProductBody = (categoryId: string) => ({
  name: 'Laptop Asus VivoBook',
  description: 'Laptop performant pour usage quotidien au Sénégal',
  sku: `SKU-TEST-${Date.now()}`,
  price: 350000,
  currency: 'XOF',
  stock: 10,
  category: categoryId,
  images: [{ url: 'https://res.cloudinary.com/test/image.jpg', isPrimary: true, order: 0 }],
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Products API', () => {
  let categoryId: string;
  let adminToken: string;

  beforeEach(async () => {
    const category = await createCategory();
    categoryId = category._id.toString();
    const { token } = await createAdminAndLogin();
    adminToken = token;
  });

  // ─── GET /products ──────────────────────────────────────────────────────────
  describe('GET /api/v1/products', () => {
    it('retourne une liste paginée de produits actifs', async () => {
      await Product.create({ ...makeProductBody(categoryId), slug: 'laptop-asus-vivobook', isActive: true });

      const res = await request(app).get('/api/v1/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination).toHaveProperty('total');
      expect(res.body.pagination).toHaveProperty('page');
    });

    it('filtre par catégorie', async () => {
      await Product.create({ ...makeProductBody(categoryId), slug: 'laptop-cat-test', isActive: true });

      const res = await request(app).get(`/api/v1/products?category=${categoryId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('filtre par prix min/max', async () => {
      await Product.create({ ...makeProductBody(categoryId), slug: 'laptop-price-test', price: 200000, isActive: true });

      const res = await request(app).get('/api/v1/products?minPrice=100000&maxPrice=300000');
      expect(res.status).toBe(200);
      res.body.data.forEach((p: any) => {
        expect(p.price).toBeGreaterThanOrEqual(100000);
        expect(p.price).toBeLessThanOrEqual(300000);
      });
    });

    it('supporte la pagination (page, limit)', async () => {
      const res = await request(app).get('/api/v1/products?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
    });

    it('ne retourne pas les produits inactifs', async () => {
      await Product.create({ ...makeProductBody(categoryId), slug: 'laptop-inactive', isActive: false, sku: `SKU-INACTIVE-${Date.now()}` });

      const res = await request(app).get('/api/v1/products');
      const inactive = res.body.data.find((p: any) => p.slug === 'laptop-inactive');
      expect(inactive).toBeUndefined();
    });
  });

  // ─── GET /products/slug/:slug ───────────────────────────────────────────────
  describe('GET /api/v1/products/slug/:slug', () => {
    it('retourne le produit par slug', async () => {
      await Product.create({ ...makeProductBody(categoryId), slug: 'laptop-slug-test', isActive: true });

      const res = await request(app).get('/api/v1/products/slug/laptop-slug-test');
      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe('laptop-slug-test');
    });

    it('retourne 404 pour un slug inexistant', async () => {
      const res = await request(app).get('/api/v1/products/slug/inexistant-xyz');
      expect(res.status).toBe(404);
    });
  });

  // ─── POST /products (admin) ─────────────────────────────────────────────────
  describe('POST /api/v1/products (admin)', () => {
    it('crée un produit avec un token admin', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(makeProductBody(categoryId));

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Laptop Asus VivoBook');
      expect(res.body.data.slug).toBeDefined();
    });

    it('refuse sans authentification — 401', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .send(makeProductBody(categoryId));
      expect(res.status).toBe(401);
    });

    it('refuse pour un rôle client — 403', async () => {
      await User.create({
        firstName: 'Client',
        lastName: 'Test',
        email: 'client@test.com',
        password: 'ClientPass123!',
        role: 'client',
        isActive: true,
      });
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'client@test.com', password: 'ClientPass123!' });
      const clientToken = loginRes.body.data.accessToken;

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(makeProductBody(categoryId));
      expect(res.status).toBe(403);
    });
  });

  // ─── PUT /products/:id (admin) ──────────────────────────────────────────────
  describe('PUT /api/v1/products/:id (admin)', () => {
    it('met à jour un produit existant', async () => {
      const product = await Product.create({ ...makeProductBody(categoryId), slug: 'laptop-to-update', isActive: true });

      const res = await request(app)
        .put(`/api/v1/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 400000 });

      expect(res.status).toBe(200);
      expect(res.body.data.price).toBe(400000);
    });

    it('retourne 404 pour un ID inexistant', async () => {
      const fakeId = '64a0f1234567890abcdef123';
      const res = await request(app)
        .put(`/api/v1/products/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 99999 });
      expect(res.status).toBe(404);
    });
  });

  // ─── DELETE /products/:id (admin, soft delete) ──────────────────────────────
  describe('DELETE /api/v1/products/:id (admin)', () => {
    it('désactive (soft delete) un produit', async () => {
      const product = await Product.create({ ...makeProductBody(categoryId), slug: 'laptop-to-delete', isActive: true });

      const res = await request(app)
        .delete(`/api/v1/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const updated = await Product.findById(product._id);
      expect(updated?.isActive).toBe(false);
    });
  });
});
