const mockSessionCreate = jest.fn();
const mockSessionRetrieve = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockSessionCreate,
        retrieve: mockSessionRetrieve,
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

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
afterEach(() => clearTestDb());

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const MockStripe = require('stripe') as jest.Mock;
  MockStripe.mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockSessionCreate,
        retrieve: mockSessionRetrieve,
      },
    },
  }));
});

// ─── POST /payments/checkout ──────────────────────────────────────────────────

describe('POST /payments/create-checkout-session', () => {
  it('200 — devuelve URL de Stripe con amount válido', async () => {
    const user = await createUser({ email: 'pay@test.com' });
    mockSessionCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/test' });

    const res = await request(app)
      .post('/payments/create-checkout-session')
      .set(authHeader(user))
      .send({ amount: 50 });

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://checkout.stripe.com/test');
  });

  it('400 — amount menor a 10', async () => {
    const user = await createUser({ email: 'pay2@test.com' });

    const res = await request(app)
      .post('/payments/create-checkout-session')
      .set(authHeader(user))
      .send({ amount: 5 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/mínimo/i);
  });

  it('400 — amount ausente', async () => {
    const user = await createUser({ email: 'pay3@test.com' });

    const res = await request(app)
      .post('/payments/create-checkout-session')
      .set(authHeader(user))
      .send({});

    expect(res.status).toBe(400);
  });

  it('401 — sin token', async () => {
    const res = await request(app)
      .post('/payments/create-checkout-session')
      .send({ amount: 50 });

    expect(res.status).toBe(401);
  });
});

// ─── POST /payments/verify ────────────────────────────────────────────────────

describe('POST /payments/verify-success', () => {
  it('200 — pago exitoso agrega créditos al usuario', async () => {
    const user = await createUser({ email: 'verify@test.com', credits: 100 });
    mockSessionRetrieve.mockResolvedValue({
      payment_status: 'paid',
      metadata: { userId: String(user._id), creditsAmount: '50' },
    });

    const res = await request(app)
      .post('/payments/verify-success')
      .set(authHeader(user))
      .send({ session_id: 'sess_paid' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.newCredits).toBe(150);
  });

  it('400 — pago no completado (unpaid)', async () => {
    const user = await createUser({ email: 'verify2@test.com' });
    mockSessionRetrieve.mockResolvedValue({
      payment_status: 'unpaid',
      metadata: { userId: String(user._id), creditsAmount: '50' },
    });

    const res = await request(app)
      .post('/payments/verify-success')
      .set(authHeader(user))
      .send({ session_id: 'sess_unpaid' });

    expect(res.status).toBe(400);
  });

  it('400 — sin session_id', async () => {
    const user = await createUser({ email: 'verify3@test.com' });

    const res = await request(app)
      .post('/payments/verify-success')
      .set(authHeader(user))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/session_id/i);
  });

  it('401 — sin token', async () => {
    const res = await request(app)
      .post('/payments/verify-success')
      .send({ session_id: 'sess_any' });

    expect(res.status).toBe(401);
  });
});
