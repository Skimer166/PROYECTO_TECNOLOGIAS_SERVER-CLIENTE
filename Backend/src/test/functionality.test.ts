// Unit / functionality tests for gaps not covered by existing test files

jest.mock('../app/users/model', () => ({
  UserModel: { findById: jest.fn(), findOne: jest.fn() },
}));

jest.mock('../app/agents/model', () => ({
  AgentModel: { findById: jest.fn(), find: jest.fn() },
}));

jest.mock('../app/mailer/controller', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

import { Request, Response } from 'express';
import { rentAgent, releaseAgent, getMyRentedAgents, searchAgent } from '../app/agents/controller';
import { verifyAdmin } from '../app/middlewares/auth';
import { UserModel } from '../app/users/model';
import { AgentModel } from '../app/agents/model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRes() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return { res: { status, json } as unknown as Response, json, status };
}

// Use valid ObjectIds so new Types.ObjectId(userId) inside controllers doesn't throw
const VALID_USER_ID = '507f1f77bcf86cd799439011';
const VALID_AGENT_ID = '507f1f77bcf86cd799439012';

// ─── rentAgent — unit multiplier calculation ──────────────────────────────────

describe('rentAgent() — cálculo de duración y costo', () => {
  let req: Partial<Request>;

  beforeEach(() => {
    (UserModel.findById as jest.Mock).mockReset();
    (AgentModel.findById as jest.Mock).mockReset();
  });

  function makeAgent(price: number, rentedBy?: string) {
    return {
      _id: VALID_AGENT_ID,
      pricePerHour: price,
      rentedBy: rentedBy ? { toString: () => rentedBy } : undefined,
      rentedUntil: null,
      instructions: 'test',
      save: jest.fn().mockResolvedValue(true),
    };
  }

  function makeUser(credits: number) {
    return {
      _id: VALID_USER_ID,
      credits,
      save: jest.fn().mockResolvedValue(true),
    };
  }

  // rentAgent calls UserModel.findById(id).exec() and AgentModel.findById(id).exec()
  function mockRentSetup(user: ReturnType<typeof makeUser>, agent: ReturnType<typeof makeAgent>) {
    (UserModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });
    (AgentModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(agent) });
  }

  it('unit="days" — multiplica por 24 y cobra correctamente', async () => {
    const agent = makeAgent(10); // 10/hr
    const user = makeUser(500);
    mockRentSetup(user, agent);

    req = { params: { id: 'agent1' }, body: { amount: 2, unit: 'days' }, user: { id: VALID_USER_ID } } as unknown as Request;

    const { res, json, status } = makeRes();
    await rentAgent(req as Request, res);

    // 2 days = 48 hrs × $10 = $480
    expect(status).not.toHaveBeenCalledWith(402);
    expect(user.credits).toBe(500 - 480);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ remainingCredits: 20 }));
  });

  it('unit="months" — multiplica por 24×30 y cobra correctamente', async () => {
    const agent = makeAgent(1); // 1/hr
    const user = makeUser(1000);
    mockRentSetup(user, agent);

    req = { params: { id: 'agent1' }, body: { amount: 1, unit: 'months' }, user: { id: VALID_USER_ID } } as unknown as Request;

    const { res, json } = makeRes();
    await rentAgent(req as Request, res);

    // 1 month = 720 hrs × $1 = $720
    expect(user.credits).toBe(1000 - 720);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ remainingCredits: 280 }));
  });

  it('unit desconocido — usa multiplicador 1 (horas)', async () => {
    const agent = makeAgent(10);
    const user = makeUser(500);
    mockRentSetup(user, agent);

    req = { params: { id: 'agent1' }, body: { amount: 3, unit: 'weeks' }, user: { id: VALID_USER_ID } } as unknown as Request;

    const { res, json } = makeRes();
    await rentAgent(req as Request, res);

    // 'weeks' hits default → multiplier=1 → 3 hrs × $10 = $30
    expect(user.credits).toBe(500 - 30);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ remainingCredits: 470 }));
  });

  it('unit="hours" por defecto cuando no se pasa body — amount=1, unit="hours"', async () => {
    const agent = makeAgent(5);
    const user = makeUser(100);
    mockRentSetup(user, agent);

    req = { params: { id: 'agent1' }, body: {}, user: { id: VALID_USER_ID } } as unknown as Request;

    const { res, json } = makeRes();
    await rentAgent(req as Request, res);

    // defaults: amount=1, unit='hours' → 1hr × $5 = $5
    expect(user.credits).toBe(95);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ remainingCredits: 95 }));
  });

  it('402 — créditos exactamente iguales al costo: debe permitir la renta', async () => {
    const agent = makeAgent(10);
    const user = makeUser(10); // exactly enough
    mockRentSetup(user, agent);

    req = { params: { id: 'agent1' }, body: { amount: 1, unit: 'hours' }, user: { id: VALID_USER_ID } } as unknown as Request;

    const { res, status } = makeRes();
    await rentAgent(req as Request, res);

    expect(status).not.toHaveBeenCalledWith(402);
    expect(user.credits).toBe(0);
  });
});

// ─── searchAgent — edge cases ─────────────────────────────────────────────────

describe('searchAgent()', () => {
  beforeEach(() => {
    (AgentModel.find as jest.Mock).mockReset();
  });

  it('sin query devuelve todos los agentes', async () => {
    const req = { query: {} } as unknown as Request;
    const { res, json } = makeRes();

    (AgentModel.find as jest.Mock).mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve([{ name: 'A' }, { name: 'B' }]) }),
    });

    await searchAgent(req, res);

    expect(json).toHaveBeenCalledWith({ agents: expect.arrayContaining([{ name: 'A' }]) });
  });

  it('query sin coincidencias devuelve array vacío', async () => {
    const req = { query: { search: 'xyznonexistent' } } as unknown as Request;
    const { res, json } = makeRes();

    (AgentModel.find as jest.Mock).mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve([]) }),
    });

    await searchAgent(req, res);

    expect(json).toHaveBeenCalledWith({ agents: [] });
  });

  it('error en DB → devuelve 500', async () => {
    const req = { query: { search: 'test' } } as unknown as Request;
    const { res, status, json } = makeRes();

    (AgentModel.find as jest.Mock).mockReturnValue({
      lean: () => ({ exec: () => Promise.reject(new Error('DB error')) }),
    });

    await searchAgent(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ message: 'Error al buscar agentes' });
  });
});

// ─── releaseAgent — ownership checks ─────────────────────────────────────────

describe('releaseAgent()', () => {
  beforeEach(() => {
    (AgentModel.findById as jest.Mock).mockReset();
  });

  // releaseAgent calls AgentModel.findById(id).exec()
  function mockAgentExec(value: unknown) {
    (AgentModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(value) });
  }

  it('404 — agente no encontrado', async () => {
    const req = { params: { id: 'bad' }, user: { id: VALID_USER_ID, sub: VALID_USER_ID } } as unknown as Request;
    const { res, status } = makeRes();

    mockAgentExec(null);

    await releaseAgent(req, res);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('403 — agente rentado por otro usuario', async () => {
    const req = { params: { id: 'agent1' }, user: { id: '507f1f77bcf86cd799439099', sub: '507f1f77bcf86cd799439099' } } as unknown as Request;
    const { res, status } = makeRes();

    mockAgentExec({ rentedBy: { toString: () => 'userA' }, save: jest.fn() });

    await releaseAgent(req, res);

    expect(status).toHaveBeenCalledWith(403);
  });

  it('200 — dueño libera el agente correctamente', async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const req = { params: { id: 'agent1' }, user: { id: VALID_USER_ID, sub: VALID_USER_ID } } as unknown as Request;
    const { res, json } = makeRes();

    const agent: Record<string, unknown> = { rentedBy: { toString: () => VALID_USER_ID }, save: saveMock };
    mockAgentExec(agent);

    await releaseAgent(req, res);

    expect(saveMock).toHaveBeenCalled();
    expect(agent.rentedBy).toBeUndefined();
    expect(json).toHaveBeenCalledWith({ message: 'Agente liberado' });
  });
});

// ─── verifyAdmin middleware ───────────────────────────────────────────────────

describe('verifyAdmin()', () => {
  it('401 — req.user es undefined', () => {
    const req = {} as Request;
    const { res, status } = makeRes();
    const next = jest.fn();

    verifyAdmin(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('403 — user existe pero role es "user"', () => {
    const req = { user: { id: '1', role: 'user' } } as unknown as Request;
    const { res, status } = makeRes();
    const next = jest.fn();

    verifyAdmin(req, res, next);

    expect(status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('pasa al siguiente middleware cuando role es "admin"', () => {
    const req = { user: { id: '1', role: 'admin' } } as unknown as Request;
    const { res } = makeRes();
    const next = jest.fn();

    verifyAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

// ─── getMyRentedAgents ────────────────────────────────────────────────────────

describe('getMyRentedAgents()', () => {
  beforeEach(() => {
    (AgentModel.find as jest.Mock).mockReset();
  });

  it('401 — sin userId en req.user', async () => {
    const req = { user: {} } as unknown as Request;
    const { res, status } = makeRes();

    await getMyRentedAgents(req, res);

    expect(status).toHaveBeenCalledWith(401);
  });

  it('usa user.sub como fallback cuando user.id no está', async () => {
    const req = { user: { sub: 'user-sub-id' } } as unknown as Request;
    const { res, json } = makeRes();

    (AgentModel.find as jest.Mock).mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve([]) }),
    });

    await getMyRentedAgents(req, res);

    expect(AgentModel.find).toHaveBeenCalledWith({ rentedBy: 'user-sub-id' });
    expect(json).toHaveBeenCalledWith({ agents: [] });
  });
});
