const mockOpenAICreate = jest.fn();

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockOpenAICreate,
      },
    },
  }));
});

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

async function createAvailableAgent() {
  return AgentModel.create({
    name: 'ChatBot',
    description: 'Un agente de chat',
    category: 'asistente',
    language: 'español',
    modelVersion: 'gpt-4o',
    instructions: 'Responde de manera útil.',
    pricePerHour: 5,
    availability: true,
    createdBy: '507f1f77bcf86cd799439011',
  });
}

// ─── POST /chat ───────────────────────────────────────────────────────────────

describe('POST /chat', () => {
  it('200 — responde con mensaje del agente', async () => {
    const user = await createUser({ email: 'chat@test.com' });
    const agent = await createAvailableAgent();
    mockOpenAICreate.mockResolvedValue({
      choices: [{ message: { content: 'Hola, soy el agente.' } }],
      usage: { total_tokens: 20 },
    });

    const res = await request(app)
      .post('/chat')
      .set(authHeader(user))
      .send({ agentId: String(agent._id), message: 'Hola' });

    expect(res.status).toBe(200);
    expect(res.body.response).toBe('Hola, soy el agente.');
    expect(res.body.agent).toBe('ChatBot');
  });

  it('400 — falta agentId o message', async () => {
    const user = await createUser({ email: 'chat2@test.com' });

    const res = await request(app)
      .post('/chat')
      .set(authHeader(user))
      .send({ message: 'Hola' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/agentId/i);
  });

  it('404 — agentId no existe', async () => {
    const user = await createUser({ email: 'chat3@test.com' });

    const res = await request(app)
      .post('/chat')
      .set(authHeader(user))
      .send({ agentId: '507f1f77bcf86cd799439011', message: 'Hola' });

    expect(res.status).toBe(404);
  });

  it('403 — agente no disponible', async () => {
    const user = await createUser({ email: 'chat4@test.com' });
    const agent = await AgentModel.create({
      name: 'Offline',
      description: 'desc',
      category: 'otros',
      language: 'español',
      modelVersion: 'gpt-4o',
      instructions: 'x',
      pricePerHour: 5,
      availability: false,
      createdBy: '507f1f77bcf86cd799439011',
    });

    const res = await request(app)
      .post('/chat')
      .set(authHeader(user))
      .send({ agentId: String(agent._id), message: 'Hola' });

    expect(res.status).toBe(403);
  });

  it('401 — sin token', async () => {
    const agent = await createAvailableAgent();

    const res = await request(app)
      .post('/chat')
      .send({ agentId: String(agent._id), message: 'Hola' });

    expect(res.status).toBe(401);
  });
});
