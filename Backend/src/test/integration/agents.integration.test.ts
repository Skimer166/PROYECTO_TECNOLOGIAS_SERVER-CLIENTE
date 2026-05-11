jest.mock('../../app/mailer/controller', () => ({
  sendEmail: jest.fn((_req: unknown, res: { send: (s: string) => void }) => res.send('ok')),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import app from '../../app';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup/db';
import { createUser, authHeader } from './setup/helpers';
import { AgentModel } from '../../app/agents/model';

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
afterEach(() => clearTestDb());

async function createAgent(overrides: Record<string, unknown> = {}) {
  return AgentModel.create({
    name: overrides.name ?? 'AgentX',
    description: overrides.description ?? 'Test agent',
    category: overrides.category ?? 'otros',
    language: 'español',
    modelVersion: 'gpt-4o',
    instructions: 'Sé útil.',
    pricePerHour: overrides.pricePerHour ?? 10,
    availability: overrides.availability ?? true,
    createdBy: overrides.createdBy ?? '507f1f77bcf86cd799439011',
    ...overrides,
  });
}

// ─── GET /agents ──────────────────────────────────────────────────────────────

describe('GET /agents', () => {
  it('200 — devuelve lista de agentes con token', async () => {
    const user = await createUser({ email: 'u@test.com' });
    await createAgent();

    const res = await request(app).get('/agents').set(authHeader(user));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.agents)).toBe(true);
    expect(res.body.agents.length).toBe(1);
  });

  it('401 — sin token', async () => {
    const res = await request(app).get('/agents');
    expect(res.status).toBe(401);
  });

  it('200 — filtra por disponibilidad', async () => {
    const user = await createUser({ email: 'u2@test.com' });
    await createAgent({ availability: true });
    await createAgent({ name: 'AgentY', availability: false });

    const res = await request(app)
      .get('/agents?available=true')
      .set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.agents.length).toBe(1);
    expect(res.body.agents[0].name).toBe('AgentX');
  });
});

// ─── GET /agents/search ───────────────────────────────────────────────────────

describe('GET /agents/search', () => {
  it('200 — encuentra agente por nombre', async () => {
    await createAgent({ name: 'Asistente Ventas' });

    const res = await request(app).get('/agents/search?search=ventas');

    expect(res.status).toBe(200);
    expect(res.body.agents.length).toBe(1);
    expect(res.body.agents[0].name).toBe('Asistente Ventas');
  });

  it('200 — sin query devuelve todos', async () => {
    await createAgent({ name: 'A1' });
    await createAgent({ name: 'A2' });

    const res = await request(app).get('/agents/search');

    expect(res.status).toBe(200);
    expect(res.body.agents.length).toBe(2);
  });
});

// ─── GET /agents/:id ──────────────────────────────────────────────────────────

describe('GET /agents/:id', () => {
  it('200 — devuelve agente por ID', async () => {
    const user = await createUser({ email: 'u3@test.com' });
    const agent = await createAgent({ name: 'DetalleAgent' });

    const res = await request(app)
      .get(`/agents/${agent._id}`)
      .set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('DetalleAgent');
  });

  it('404 — ID válido pero agente no existe', async () => {
    const user = await createUser({ email: 'u4@test.com' });

    const res = await request(app)
      .get('/agents/507f1f77bcf86cd799439011')
      .set(authHeader(user));

    expect(res.status).toBe(404);
  });
});

// ─── POST /agents (admin) ─────────────────────────────────────────────────────

describe('POST /agents', () => {
  it('403 — usuario normal no puede crear agente', async () => {
    const user = await createUser({ email: 'u5@test.com' });

    const res = await request(app)
      .post('/agents')
      .set(authHeader(user))
      .send({ name: 'Nuevo', category: 'otros', language: 'es', modelVersion: 'gpt-4o' });

    expect(res.status).toBe(403);
  });

  it('201 — admin crea agente', async () => {
    const admin = await createUser({ email: 'admin@test.com', role: 'admin' });

    const res = await request(app)
      .post('/agents')
      .set(authHeader(admin))
      .send({
        name: 'AdminAgent',
        description: 'desc',
        category: 'educacion',
        language: 'español',
        modelVersion: 'gpt-4o',
        instructions: 'Enseña.',
        pricePerHour: 5,
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('AdminAgent');
  });
});

// ─── POST /agents/:id/rent ────────────────────────────────────────────────────

describe('POST /agents/:id/rent', () => {
  it('200 — usuario con créditos renta agente', async () => {
    const user = await createUser({ email: 'renter@test.com', credits: 500 });
    const agent = await createAgent({ pricePerHour: 10 });

    const res = await request(app)
      .post(`/agents/${agent._id}/rent`)
      .set(authHeader(user))
      .send({ amount: 1, unit: 'hours' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/exitosa/i);
    expect(res.body.remainingCredits).toBe(490);
  });

  it('402 — créditos insuficientes', async () => {
    const user = await createUser({ email: 'broke@test.com', credits: 0 });
    const agent = await createAgent({ pricePerHour: 50 });

    const res = await request(app)
      .post(`/agents/${agent._id}/rent`)
      .set(authHeader(user))
      .send({ amount: 1, unit: 'hours' });

    expect(res.status).toBe(402);
  });

  it('400 — agente ya rentado por otro usuario', async () => {
    const user1 = await createUser({ email: 'r1@test.com', credits: 500 });
    const user2 = await createUser({ email: 'r2@test.com', credits: 500, name: 'User2' });
    const agent = await createAgent({ pricePerHour: 10 });

    // user1 renta el agente
    await request(app)
      .post(`/agents/${agent._id}/rent`)
      .set(authHeader(user1))
      .send({ amount: 1, unit: 'hours' });

    // user2 intenta rentarlo también
    const res = await request(app)
      .post(`/agents/${agent._id}/rent`)
      .set(authHeader(user2))
      .send({ amount: 1, unit: 'hours' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/ocupado/i);
  });
});

// ─── GET /agents/my-rentals ───────────────────────────────────────────────────

describe('GET /agents/my-rentals', () => {
  it('200 — devuelve agentes rentados por el usuario', async () => {
    const user = await createUser({ email: 'myrent@test.com', credits: 1000 });
    const agent = await createAgent({ pricePerHour: 10 });

    await request(app)
      .post(`/agents/${agent._id}/rent`)
      .set(authHeader(user))
      .send({ amount: 1, unit: 'hours' });

    const res = await request(app)
      .get('/agents/my-rentals')
      .set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.agents.length).toBe(1);
  });

  it('200 — lista vacía si no ha rentado ningún agente', async () => {
    const user = await createUser({ email: 'norent@test.com' });

    const res = await request(app)
      .get('/agents/my-rentals')
      .set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.agents.length).toBe(0);
  });
});

// ─── POST /agents/:id/release ─────────────────────────────────────────────────

describe('POST /agents/:id/release', () => {
  it('200 — usuario libera su agente rentado', async () => {
    const user = await createUser({ email: 'rel@test.com', credits: 500 });
    const agent = await createAgent({ pricePerHour: 10 });

    await request(app)
      .post(`/agents/${agent._id}/rent`)
      .set(authHeader(user))
      .send({ amount: 1, unit: 'hours' });

    const res = await request(app)
      .post(`/agents/${agent._id}/release`)
      .set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/liberado/i);
  });

  it('403 — usuario que no rentó el agente no puede liberarlo', async () => {
    const user1 = await createUser({ email: 'own@test.com', credits: 500 });
    const user2 = await createUser({ email: 'notown@test.com', credits: 500, name: 'NoOwner' });
    const agent = await createAgent({ pricePerHour: 10 });

    await request(app)
      .post(`/agents/${agent._id}/rent`)
      .set(authHeader(user1))
      .send({ amount: 1, unit: 'hours' });

    const res = await request(app)
      .post(`/agents/${agent._id}/release`)
      .set(authHeader(user2));

    expect(res.status).toBe(403);
  });
});
