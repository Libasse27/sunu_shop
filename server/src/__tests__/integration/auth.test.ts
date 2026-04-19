import request from 'supertest';
import app from '../../app';
import User from '../../models/User.model';

const validUser = {
  firstName: 'Amadou',
  lastName: 'Diallo',
  email: 'amadou.diallo@test.com',
  password: 'MotDePasse123!',
  phone: '+221770000001',
};

describe('Auth API', () => {
  // ─── POST /api/v1/auth/register ────────────────────────────────────────────
  describe('POST /api/v1/auth/register', () => {
    it('crée un compte et retourne un accessToken', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.user.role).toBe('client');
    });

    it('hache le mot de passe (pas en clair en base)', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
      const user = await User.findOne({ email: validUser.email }).select('+password');
      expect(user?.password).toBeDefined();
      expect(user?.password).not.toBe(validUser.password);
    });

    it('rejette un email déjà utilisé — 409', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
      const res = await request(app).post('/api/v1/auth/register').send(validUser);
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('rejette un email invalide — 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, email: 'pas-un-email' });
      expect(res.status).toBe(400);
    });

    it('rejette un mot de passe trop court — 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, password: '123' });
      expect(res.status).toBe(400);
    });

    it('rejette si firstName manquant — 400', async () => {
      const { firstName: _removed, ...body } = validUser;
      const res = await request(app).post('/api/v1/auth/register').send(body);
      expect(res.status).toBe(400);
    });
  });

  // ─── POST /api/v1/auth/login ───────────────────────────────────────────────
  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
    });

    it('connecte avec des identifiants valides', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(validUser.email);
    });

    it('définit le cookie refreshToken HttpOnly', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = (Array.isArray(cookies) ? cookies : [cookies]).find(
        (c: string) => c.startsWith('refreshToken=')
      );
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');
    });

    it('rejette un mauvais mot de passe — 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: 'MauvaisMotDePasse!' });
      expect(res.status).toBe(401);
    });

    it('rejette un email inexistant — 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'inconnu@test.com', password: validUser.password });
      expect(res.status).toBe(401);
    });

    it('verrouille le compte après 5 tentatives échouées', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({ email: validUser.email, password: 'Mauvais123!' });
      }
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password });
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/verrouillé/i);
    });
  });

  // ─── POST /api/v1/auth/logout ──────────────────────────────────────────────
  describe('POST /api/v1/auth/logout', () => {
    it('déconnecte un utilisateur authentifié — 200', async () => {
      const loginRes = await (async () => {
        await request(app).post('/api/v1/auth/register').send(validUser);
        return request(app).post('/api/v1/auth/login').send({
          email: validUser.email,
          password: validUser.password,
        });
      })();
      const { accessToken } = loginRes.body.data;

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
    });

    it('refuse sans token — 401', async () => {
      const res = await request(app).post('/api/v1/auth/logout');
      expect(res.status).toBe(401);
    });
  });

  // ─── POST /api/v1/auth/refresh-token ──────────────────────────────────────
  describe('POST /api/v1/auth/refresh-token', () => {
    it('renouvelle le token via cookie refreshToken', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
      const agent = request.agent(app);
      await agent.post('/api/v1/auth/login').send({
        email: validUser.email,
        password: validUser.password,
      });

      const res = await agent.post('/api/v1/auth/refresh-token');
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('refuse sans refreshToken — 401', async () => {
      const res = await request(app).post('/api/v1/auth/refresh-token');
      expect(res.status).toBe(401);
    });
  });
});
