import { Request, Response } from 'express';
import {
  createAgent,
  getAllAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
  searchAgent,
  rentAgent,
  getMyRentedAgents,
  releaseAgent,
} from '../app/agents/controller';
import { AgentModel } from '../app/agents/model';
import { UserModel } from '../app/users/model';

jest.mock('../app/agents/model');
jest.mock('../app/users/model');
jest.mock('../index', () => ({
  io: { to: jest.fn().mockReturnValue({ emit: jest.fn() }) },
}));

describe('Agent Controller Unit Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
      json: jsonMock,
    } as unknown as Response;
  });

  // ─── getAllAgents ─────────────────────────────────────────────────────────────

  describe('getAllAgents()', () => {
    it('Debe retornar lista de agentes con status 200', async () => {
      req = { query: {} };
      const mockAgents = [
        { name: 'Agente 1', category: 'marketing' },
        { name: 'Agente 2', category: 'salud' },
      ];
      const mockExec = jest.fn().mockResolvedValue(mockAgents);
      const mockLean = jest.fn().mockReturnValue({ exec: mockExec });
      (AgentModel.find as jest.Mock).mockReturnValue({ lean: mockLean });

      await getAllAgents(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalledWith({ agents: mockAgents });
    });

    it('Debe filtrar por categoría si se pasa query.category', async () => {
      req = { query: { category: 'salud' } };
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockLean = jest.fn().mockReturnValue({ exec: mockExec });
      (AgentModel.find as jest.Mock).mockReturnValue({ lean: mockLean });

      await getAllAgents(req as Request, res as Response);

      expect(AgentModel.find).toHaveBeenCalledWith({ category: 'salud' });
    });

    it('Debe filtrar availability=true si query.available=true', async () => {
      req = { query: { available: 'true' } };
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockLean = jest.fn().mockReturnValue({ exec: mockExec });
      (AgentModel.find as jest.Mock).mockReturnValue({ lean: mockLean });

      await getAllAgents(req as Request, res as Response);

      expect(AgentModel.find).toHaveBeenCalledWith({ availability: true });
    });

    it('Debe retornar 500 si AgentModel.find lanza error', async () => {
      req = { query: {} };
      const mockExec = jest.fn().mockRejectedValue(new Error('DB error'));
      const mockLean = jest.fn().mockReturnValue({ exec: mockExec });
      (AgentModel.find as jest.Mock).mockReturnValue({ lean: mockLean });

      await getAllAgents(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al obtener agentes' });
    });
  });

  // ─── getAgentById ─────────────────────────────────────────────────────────────

  describe('getAgentById()', () => {
    it('Debe retornar 404 si el agente no existe', async () => {
      req = { params: { id: 'agent123' } } as unknown as Request;
      const mockExec = jest.fn().mockResolvedValue(null);
      (AgentModel.findById as jest.Mock).mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: mockExec }) });

      await getAgentById(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Agente no encontrado' });
    });

    it('Debe retornar el agente si existe', async () => {
      req = { params: { id: 'agent123' } } as unknown as Request;
      const mockAgent = { _id: 'agent123', name: 'Agente Test' };
      const mockExec = jest.fn().mockResolvedValue(mockAgent);
      (AgentModel.findById as jest.Mock).mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: mockExec }) });

      await getAgentById(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalledWith(mockAgent);
    });

    it('Debe retornar 500 si AgentModel.findById lanza error', async () => {
      req = { params: { id: 'agent123' } } as unknown as Request;
      const mockExec = jest.fn().mockRejectedValue(new Error('DB error'));
      (AgentModel.findById as jest.Mock).mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: mockExec }) });

      await getAgentById(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al obtener el agente' });
    });
  });

  // ─── createAgent ──────────────────────────────────────────────────────────────

  describe('createAgent()', () => {
    it('Debe retornar 401 si no hay usuario autenticado', async () => {
      req = { user: undefined, body: {} } as unknown as Request;

      await createAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'No autorizado' });
    });

    it('Debe retornar 403 si el usuario NO es admin', async () => {
      req = {
        user: { id: 'user123', role: 'user' },
        body: { name: 'Agente Malicioso', instructions: 'Hacker' },
      } as unknown as Request;

      await createAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Se requieren permisos de administrador' });
    });

    it('Debe retornar 201 si un admin crea el agente correctamente', async () => {
      const mockAgent = { _id: 'newAgent', name: 'Agente Legal', category: 'marketing' };
      req = {
        user: { id: 'admin123', role: 'admin' },
        body: {
          name: 'Agente Legal',
          description: 'Desc',
          category: 'marketing',
          pricePerHour: 10,
          language: 'es',
          modelVersion: 'gpt-4',
          instructions: 'Eres un experto.',
        },
        file: undefined,
      } as unknown as Request;
      (AgentModel.create as jest.Mock).mockResolvedValue(mockAgent);

      await createAgent(req as Request, res as Response);

      expect(AgentModel.create).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockAgent);
    });

    it('Debe retornar 500 si AgentModel.create lanza error', async () => {
      req = {
        user: { id: 'admin123', role: 'admin' },
        body: { name: 'Agente', instructions: 'Soy útil', pricePerHour: 5 },
        file: undefined,
      } as unknown as Request;
      (AgentModel.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await createAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error creando agente' });
    });
  });

  // ─── updateAgent ──────────────────────────────────────────────────────────────

  describe('updateAgent()', () => {
    it('Debe retornar 401 si no hay usuario autenticado', async () => {
      req = { params: { id: 'agent123' }, user: undefined, body: {} } as unknown as Request;

      await updateAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'No autorizado' });
    });

    it('Debe retornar 404 si el agente no existe', async () => {
      req = { params: { id: 'agent123' }, user: { id: 'user123', role: 'admin' }, body: {} } as unknown as Request;
      (AgentModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await updateAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Agente no encontrado' });
    });

    it('Debe retornar 403 si el usuario no es dueño ni admin', async () => {
      req = { params: { id: 'agent123' }, user: { id: 'user123', role: 'user' }, body: { name: 'Nuevo' } } as unknown as Request;
      const mockAgent = { _id: 'agent123', createdBy: { toString: () => 'otroUser' }, save: jest.fn() };
      (AgentModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockAgent) });

      await updateAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'No tienes permiso para modificar este agente' });
    });

    it('Debe actualizar el agente si el usuario es el dueño', async () => {
      req = { params: { id: 'agent123' }, user: { id: 'user123', role: 'user' }, body: { name: 'Nuevo Nombre' } } as unknown as Request;
      const mockAgent = {
        _id: 'agent123',
        createdBy: { toString: () => 'user123' },
        name: 'Viejo',
        save: jest.fn().mockResolvedValue({ _id: 'agent123', name: 'Nuevo Nombre' }),
      };
      (AgentModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockAgent) });

      await updateAgent(req as Request, res as Response);

      expect(mockAgent.name).toBe('Nuevo Nombre');
      expect(mockAgent.save).toHaveBeenCalled();
    });
  });

  // ─── deleteAgent ──────────────────────────────────────────────────────────────

  describe('deleteAgent()', () => {
    it('Debe retornar 401 si no hay usuario autenticado', async () => {
      req = { params: { id: 'agent123' }, user: undefined } as unknown as Request;

      await deleteAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'No autorizado' });
    });

    it('Debe retornar 404 si el agente no existe', async () => {
      req = { params: { id: 'agent123' }, user: { id: 'user123', role: 'admin' } } as unknown as Request;
      (AgentModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await deleteAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Agente no encontrado' });
    });

    it('Debe retornar 403 si el usuario no es dueño ni admin', async () => {
      req = { params: { id: 'agent123' }, user: { id: 'user123', role: 'user' } } as unknown as Request;
      const mockAgent = { _id: 'agent123', createdBy: { toString: () => 'otroUser' }, deleteOne: jest.fn() };
      (AgentModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockAgent) });

      await deleteAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'No tienes permiso para eliminar este agente' });
    });

    it('Debe eliminar el agente si el usuario es admin', async () => {
      req = { params: { id: 'agent123' }, user: { id: 'admin123', role: 'admin' } } as unknown as Request;
      const mockAgent = { _id: 'agent123', createdBy: { toString: () => 'user123' }, deleteOne: jest.fn().mockResolvedValue(true) };
      (AgentModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockAgent) });

      await deleteAgent(req as Request, res as Response);

      expect(mockAgent.deleteOne).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Agente eliminado correctamente' });
    });
  });

  // ─── searchAgent ──────────────────────────────────────────────────────────────

  describe('searchAgent()', () => {
    it('Debe retornar todos los agentes si no hay query de búsqueda', async () => {
      req = { query: {} } as unknown as Request;
      const mockAgents = [{ name: 'Agente A' }];
      const mockExec = jest.fn().mockResolvedValue(mockAgents);
      (AgentModel.find as jest.Mock).mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: mockExec }) });

      await searchAgent(req as Request, res as Response);

      expect(AgentModel.find).toHaveBeenCalledWith();
      expect(jsonMock).toHaveBeenCalledWith({ agents: mockAgents });
    });

    it('Debe buscar por nombre o descripción con regex', async () => {
      req = { query: { search: 'salud' } } as unknown as Request;
      const mockAgents = [{ name: 'Agente Salud' }];
      const mockExec = jest.fn().mockResolvedValue(mockAgents);
      (AgentModel.find as jest.Mock).mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: mockExec }) });

      await searchAgent(req as Request, res as Response);

      expect(AgentModel.find).toHaveBeenCalledWith(expect.objectContaining({ $or: expect.any(Array) }));
      expect(jsonMock).toHaveBeenCalledWith({ agents: mockAgents });
    });

    it('Debe retornar 500 si AgentModel.find lanza error', async () => {
      req = { query: { search: 'test' } } as unknown as Request;
      const mockExec = jest.fn().mockRejectedValue(new Error('DB error'));
      (AgentModel.find as jest.Mock).mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: mockExec }) });

      await searchAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al buscar agentes' });
    });
  });

  // ─── rentAgent ────────────────────────────────────────────────────────────────

  describe('rentAgent()', () => {
    it('Debe retornar 401 si no hay usuario autenticado', async () => {
      req = { params: { id: 'agent123' }, body: { amount: 1, unit: 'hours' }, user: undefined } as unknown as Request;

      await rentAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'No autorizado' });
    });

    it('Debe retornar 404 si el usuario o agente no existe', async () => {
      req = { params: { id: 'agent123' }, body: { amount: 1, unit: 'hours' }, user: { id: 'user123' } } as unknown as Request;
      (UserModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      (AgentModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await rentAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Usuario o Agente no encontrado' });
    });

    it('Debe retornar 400 si el agente está ocupado por otro usuario', async () => {
      req = { params: { id: 'agent123' }, body: { amount: 1, unit: 'hours' }, user: { id: 'user123' } } as unknown as Request;
      const mockUser = { _id: 'user123', credits: 1000, save: jest.fn() };
      const mockAgent = { _id: 'agent123', pricePerHour: 10, rentedBy: { toString: () => 'otroUser' } };
      (UserModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });
      (AgentModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockAgent) });

      await rentAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Agente ocupado' });
    });

    it('Debe retornar 402 si el usuario no tiene créditos suficientes', async () => {
      req = { params: { id: 'agent123' }, body: { amount: 1, unit: 'hours' }, user: { id: 'user123' } } as unknown as Request;
      const mockUser = { _id: 'user123', credits: 0, save: jest.fn() };
      const mockAgent = { _id: 'agent123', pricePerHour: 100, rentedBy: null };
      (UserModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });
      (AgentModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockAgent) });

      await rentAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(402);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Créditos insuficientes') }));
    });

    it('Debe rentar exitosamente y descontar créditos al usuario', async () => {
      const validUserId = '5f8d0d55b54764421b7156d9';
      req = { params: { id: '5f8d0d55b54764421b715700' }, body: { amount: 2, unit: 'hours' }, user: { id: validUserId } } as unknown as Request;
      const mockUser = { _id: validUserId, credits: 500, save: jest.fn().mockResolvedValue(true) };
      const mockAgent = {
        _id: '5f8d0d55b54764421b715700',
        pricePerHour: 10,
        rentedBy: null,
        rentedUntil: null,
        instructions: 'Soy útil.',
        save: jest.fn().mockResolvedValue(true),
      };
      (UserModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });
      (AgentModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockAgent) });

      await rentAgent(req as Request, res as Response);

      expect(mockUser.credits).toBe(480); // 500 - (2h * $10)
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockAgent.save).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Renta exitosa') }));
    });

    it('Debe calcular el costo en días correctamente', async () => {
      const validUserId = '5f8d0d55b54764421b7156d9';
      req = { params: { id: '5f8d0d55b54764421b715700' }, body: { amount: 1, unit: 'days' }, user: { id: validUserId } } as unknown as Request;
      const mockUser = { credits: 10000, save: jest.fn().mockResolvedValue(true) };
      const mockAgent = {
        pricePerHour: 10,
        rentedBy: null,
        instructions: 'Soy útil.',
        save: jest.fn().mockResolvedValue(true),
      };
      (UserModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });
      (AgentModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockAgent) });

      await rentAgent(req as Request, res as Response);

      // 1 día * 24h * $10 = $240
      expect(mockUser.credits).toBe(9760);
    });
  });

  // ─── getMyRentedAgents ────────────────────────────────────────────────────────

  describe('getMyRentedAgents()', () => {
    it('Debe retornar 401 si no hay usuario autenticado', async () => {
      req = { user: undefined } as unknown as Request;

      await getMyRentedAgents(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'No autorizado' });
    });

    it('Debe retornar los agentes rentados por el usuario', async () => {
      req = { user: { id: 'user123' } } as unknown as Request;
      const mockAgents = [{ _id: 'a1', name: 'Agente Rentado' }];
      const mockExec = jest.fn().mockResolvedValue(mockAgents);
      (AgentModel.find as jest.Mock).mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: mockExec }) });

      await getMyRentedAgents(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalledWith({ agents: mockAgents });
    });
  });

  // ─── releaseAgent ─────────────────────────────────────────────────────────────

  describe('releaseAgent()', () => {
    it('Debe retornar 404 si el agente no existe', async () => {
      req = { params: { id: 'agent123' }, user: { id: 'user123' } } as unknown as Request;
      (AgentModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await releaseAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Agente no encontrado' });
    });

    it('Debe retornar 403 si el usuario no es el arrendatario', async () => {
      req = { params: { id: 'agent123' }, user: { id: 'user123' } } as unknown as Request;
      const mockAgent = { rentedBy: { toString: () => 'otroUser' }, save: jest.fn() };
      (AgentModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockAgent) });

      await releaseAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'No eres el dueño de este alquiler' });
    });

    it('Debe liberar el agente exitosamente', async () => {
      req = { params: { id: 'agent123' }, user: { id: 'user123' } } as unknown as Request;
      const mockAgent = {
        rentedBy: { toString: () => 'user123' },
        save: jest.fn().mockResolvedValue(true),
      };
      (AgentModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockAgent) });

      await releaseAgent(req as Request, res as Response);

      expect(mockAgent.rentedBy).toBeUndefined();
      expect(mockAgent.save).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Agente liberado' });
    });
  });
});
