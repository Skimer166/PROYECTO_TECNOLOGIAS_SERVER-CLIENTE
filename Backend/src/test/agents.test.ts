import { Request, Response } from 'express';
import { createAgent, getAllAgents, rentAgent } from '../app/agents/controller';
import { AgentModel } from '../app/agents/model';
import { UserModel } from '../app/users/model';

// Mock de Modelos y del servidor
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
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
      json: jsonMock,
    } as unknown as Response;
  });

  // PRUEBA 4: Mock de datos (listar agentes)
  it('Debe retornar una lista de agentes con status 200', async () => {
    req = { query: {} }; // sin filtros, debe retornar todos los agentes

    const mockAgents = [
      { name: 'Agente 1', category: 'marketing' },
      { name: 'Agente 2', category: 'salud' }
    ];

    // Mockear la cadena de mongoose
    const mockExec = jest.fn().mockResolvedValue(mockAgents);
    const mockLean = jest.fn().mockReturnValue({ exec: mockExec });
    (AgentModel.find as jest.Mock).mockReturnValue({ lean: mockLean });

    await getAllAgents(req as Request, res as Response);

    expect(jsonMock).toHaveBeenCalledWith({ agents: mockAgents });
  });

  // PRUEBA 5: Verificar que solo admin puede crear agente
  it('Debe retornar 403 si un usuario NO admin intenta crear un agente', async () => {
    req = {
      user: { id: 'user123', role: 'user' },
      body: {
        name: 'Agente Malicioso',
        instructions: 'Hacker',
      }
    } as unknown as Request;

    await createAgent(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Se requieren permisos de administrador' });
  });

  // PRUEBA 6: Renta con creditos insuficientes
  it('Debe retornar 402 si el usuario no tiene suficientes créditos para rentar', async () => {
    req = {
      params: { id: 'agent123' },
      body: { amount: 1, unit: 'hours' },
      user: { id: 'user123' }
    } as unknown as Request;

    // Mockear usuario con 0 creditos
    const mockUser = { _id: 'user123', credits: 0, save: jest.fn() };
    const mockUserExec = jest.fn().mockResolvedValue(mockUser);
    (UserModel.findById as jest.Mock).mockReturnValue({ exec: mockUserExec });

    // Mockear agente que cuesta 100 creditos
    const mockAgent = { _id: 'agent123', pricePerHour: 100, rentedBy: null };
    const mockAgentExec = jest.fn().mockResolvedValue(mockAgent);
    (AgentModel.findById as jest.Mock).mockReturnValue({ exec: mockAgentExec });

    await rentAgent(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(402);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ 
      message: expect.stringContaining('Créditos insuficientes') 
    }));
  });
});