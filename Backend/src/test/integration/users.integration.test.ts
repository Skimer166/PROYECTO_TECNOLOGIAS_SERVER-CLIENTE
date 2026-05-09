jest.mock('../../app/mailer/controller', () => ({
  sendEmail: jest.fn((_req: unknown, res: { send: (s: string) => void }) => res.send('ok')),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import app from '../../app';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup/db';
import { createUser, authHeader } from './setup/helpers';

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
afterEach(() => clearTestDb());

// ─── GET /users ───────────────────────────────────────────────────────────────

describe('GET /users', () => {
  it('200 — devuelve lista de usuarios con token válido', async () => {
    const user = await createUser({ email: 'a@test.com' });

    const res = await request(app)
      .get('/users')
      .set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('401 — sin token', async () => {
    const res = await request(app).get('/users');
    expect(res.status).toBe(401);
  });

  it('403 — usuario bloqueado no puede acceder', async () => {
    const user = await createUser({ email: 'blocked@test.com', status: 'blocked' });

    const res = await request(app)
      .get('/users')
      .set(authHeader(user));

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/bloqueada/i);
  });
});

// ─── GET /users/:id ───────────────────────────────────────────────────────────

describe('GET /users/:id', () => {
  it('200 — devuelve el usuario por ID', async () => {
    const user = await createUser({ email: 'b@test.com', name: 'Beta' });

    const res = await request(app)
      .get(`/users/${user._id}`)
      .set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('b@test.com');
  });

  it('404 — ID válido pero usuario no existe', async () => {
    const user = await createUser({ email: 'auth@test.com' });
    const fakeId = '507f1f77bcf86cd799439011';

    const res = await request(app)
      .get(`/users/${fakeId}`)
      .set(authHeader(user));

    expect(res.status).toBe(404);
  });

  it('400 — ID con formato inválido', async () => {
    const user = await createUser({ email: 'auth2@test.com' });

    const res = await request(app)
      .get('/users/not-an-id')
      .set(authHeader(user));

    expect(res.status).toBe(400);
  });
});

// ─── PUT /users/:id ───────────────────────────────────────────────────────────

describe('PUT /users/:id', () => {
  it('200 — actualiza nombre del usuario', async () => {
    const user = await createUser({ email: 'upd@test.com', name: 'OldName' });

    const res = await request(app)
      .put(`/users/${user._id}`)
      .set(authHeader(user))
      .send({ name: 'NewName' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('NewName');
    expect(res.body).toHaveProperty('token');
  });

  it('400 — body vacío', async () => {
    const user = await createUser({ email: 'upd2@test.com' });

    const res = await request(app)
      .put(`/users/${user._id}`)
      .set(authHeader(user))
      .send({});

    expect(res.status).toBe(400);
  });

  it('409 — email ya en uso por otro usuario', async () => {
    const user1 = await createUser({ email: 'u1@test.com', name: 'U1' });
    const user2 = await createUser({ email: 'u2@test.com', name: 'U2' });

    const res = await request(app)
      .put(`/users/${user2._id}`)
      .set(authHeader(user2))
      .send({ email: 'u1@test.com' });

    expect(res.status).toBe(409);
  });
});

// ─── DELETE /users/:id ────────────────────────────────────────────────────────

describe('DELETE /users/:id', () => {
  it('204 — admin puede eliminar usuario', async () => {
    const admin = await createUser({ email: 'admin@test.com', role: 'admin' });
    const target = await createUser({ email: 'target@test.com', name: 'Target' });

    const res = await request(app)
      .delete(`/users/${target._id}`)
      .set(authHeader(admin));

    expect(res.status).toBe(204);
  });

  it('403 — usuario normal no puede eliminar', async () => {
    const user = await createUser({ email: 'normal@test.com' });
    const target = await createUser({ email: 'target2@test.com', name: 'Target2' });

    const res = await request(app)
      .delete(`/users/${target._id}`)
      .set(authHeader(user));

    expect(res.status).toBe(403);
  });
});

// ─── PUT /users/:id/role ─────────────────────────────────────────────────────

describe('PUT /users/:id/role', () => {
  it('200 — admin actualiza rol a admin', async () => {
    const admin = await createUser({ email: 'admin2@test.com', role: 'admin' });
    const target = await createUser({ email: 'promote@test.com', name: 'Promote' });

    const res = await request(app)
      .put(`/users/${target._id}/role`)
      .set(authHeader(admin))
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');
  });

  it('400 — rol inválido', async () => {
    const admin = await createUser({ email: 'admin3@test.com', role: 'admin' });
    const target = await createUser({ email: 'target3@test.com', name: 'Target3' });

    const res = await request(app)
      .put(`/users/${target._id}/role`)
      .set(authHeader(admin))
      .send({ role: 'superuser' });

    expect(res.status).toBe(400);
  });

  it('403 — usuario normal no puede cambiar roles', async () => {
    const user = await createUser({ email: 'nonadmin@test.com' });
    const target = await createUser({ email: 'target4@test.com', name: 'Target4' });

    const res = await request(app)
      .put(`/users/${target._id}/role`)
      .set(authHeader(user))
      .send({ role: 'admin' });

    expect(res.status).toBe(403);
  });
});

// ─── PUT /users/:id/credits ───────────────────────────────────────────────────

describe('PUT /users/:id/credits', () => {
  it('200 — admin agrega créditos a usuario', async () => {
    const admin = await createUser({ email: 'admin4@test.com', role: 'admin' });
    const target = await createUser({ email: 'credits@test.com', name: 'Credits', credits: 50 });

    const res = await request(app)
      .put(`/users/${target._id}/credits`)
      .set(authHeader(admin))
      .send({ amount: 100 });

    expect(res.status).toBe(200);
    expect(res.body.credits).toBe(150);
  });

  it('400 — amount inválido (negativo)', async () => {
    const admin = await createUser({ email: 'admin5@test.com', role: 'admin' });
    const target = await createUser({ email: 'credits2@test.com', name: 'Credits2' });

    const res = await request(app)
      .put(`/users/${target._id}/credits`)
      .set(authHeader(admin))
      .send({ amount: -10 });

    expect(res.status).toBe(400);
  });
});
