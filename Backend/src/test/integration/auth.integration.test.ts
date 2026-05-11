jest.mock('../../app/mailer/controller', () => ({
  sendEmail: jest.fn((_req: unknown, res: { send: (s: string) => void }) => res.send('ok')),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import app from '../../app';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup/db';
import { createUser } from './setup/helpers';

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
afterEach(() => clearTestDb());

// ─── POST /auth/signup ────────────────────────────────────────────────────────

describe('POST /auth/signup', () => {
  it('201 — crea usuario con datos válidos', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ name: 'Juan', email: 'juan@test.com', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: 'Juan', email: 'juan@test.com' });
  });

  it('400 — faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ name: 'Juan', email: 'juan@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/rellena/i);
  });

  it('400 — formato de email inválido', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ name: 'Juan', email: 'not-an-email', password: 'secret123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/correo/i);
  });

  it('409 — email ya registrado', async () => {
    await createUser({ email: 'juan@test.com', name: 'Juan' });

    const res = await request(app)
      .post('/auth/signup')
      .send({ name: 'OtroJuan', email: 'juan@test.com', password: 'secret123' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/email/i);
  });

  it('409 — nombre de usuario ya registrado', async () => {
    await createUser({ name: 'Juan', email: 'otro@test.com' });

    const res = await request(app)
      .post('/auth/signup')
      .send({ name: 'Juan', email: 'nuevojuan@test.com', password: 'secret123' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/nombre/i);
  });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  it('200 — devuelve token con credenciales correctas', async () => {
    await createUser({ email: 'user@test.com', password: 'pass123' });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'pass123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('user@test.com');
  });

  it('401 — contraseña incorrecta', async () => {
    await createUser({ email: 'user@test.com', password: 'pass123' });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('401 — email no existe', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'noexiste@test.com', password: 'pass123' });

    expect(res.status).toBe(401);
  });

  it('400 — cuenta creada con Google (sin passwordHash)', async () => {
    await createUser({ email: 'google@test.com', password: undefined as unknown as string });
    // Remove passwordHash manually to simulate Google account
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { UserModel } = require('../../app/users/model');
    await UserModel.findOneAndUpdate({ email: 'google@test.com' }, { $unset: { passwordHash: 1 } });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'google@test.com', password: 'anything' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/google/i);
  });
});

// ─── POST /auth/forgot-password ───────────────────────────────────────────────

describe('POST /auth/forgot-password', () => {
  it('200 — responde 200 aunque el email no exista (no revela información)', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'noexiste@test.com' });

    expect(res.status).toBe(200);
  });

  it('200 — responde 200 y guarda token cuando el email sí existe', async () => {
    await createUser({ email: 'real@test.com' });

    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'real@test.com' });

    expect(res.status).toBe(200);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { UserModel } = require('../../app/users/model');
    const user = await UserModel.findOne({ email: 'real@test.com' });
    expect(user?.resetPasswordToken).toBeDefined();
  });

  it('400 — falta el campo email', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });
});
