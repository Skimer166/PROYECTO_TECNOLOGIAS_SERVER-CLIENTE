// Mock de Mongoose y OpenAI
jest.mock('../app/agents/model', () => ({
  AgentModel: {
    findById: jest.fn(),
  },
}));

const mockCreate = jest.fn();

jest.mock('openai', () => ({
  __esModule: true,
  default: class MockOpenAI {
    chat = {
      completions: {
        create: mockCreate,
      },
    };
  },
}));

import { Request, Response } from 'express';
import { chatWithAgent } from '../app/chat/controller';
import { AgentModel } from '../app/agents/model';

describe('Chat Controller Unit Tests', () => {
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

  describe('chatWithAgent()', () => {
    it('Debe retornar 400 si faltan agentId o message', async () => {
      req = { body: {} }; // Body vacío

      await chatWithAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Se requiere agentId y message' });
    });

    it('Debe retornar 400 si falta agentId', async () => {
      req = { body: { message: 'Hola' } };

      await chatWithAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Se requiere agentId y message' });
    });

    it('Debe retornar 400 si falta message', async () => {
      req = { body: { agentId: '123' } };

      await chatWithAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Se requiere agentId y message' });
    });

    it('Debe retornar 404 si el agente no existe', async () => {
      req = { body: { agentId: '123', message: 'Hola' } };

      (AgentModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null) // No encontrado
      });

      await chatWithAgent(req as Request, res as Response);

      expect(AgentModel.findById).toHaveBeenCalledWith('123');
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Agente no encontrado' });
    });

    it('Debe retornar 403 si el agente no está disponible', async () => {
      req = { body: { agentId: '123', message: 'Hola' } };

      const mockAgent = {
        _id: '123',
        name: 'Agente Test',
        availability: false, // No disponible
        modelVersion: 'gpt-3.5-turbo',
        instructions: 'Eres un asistente.'
      };

      (AgentModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockAgent)
      });

      await chatWithAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Este agente no está disponible actualmente.' });
    });

    it('Debe retornar la respuesta del agente correctamente', async () => {
      req = { body: { agentId: '123', message: 'Hola' } };

      const mockAgent = {
        _id: '123',
        name: 'Agente Test',
        availability: true,
        modelVersion: 'gpt-3.5-turbo',
        instructions: 'Eres un asistente útil.'
      };

      const mockCompletion = {
        choices: [{ message: { content: 'Hola, ¿en qué puedo ayudarte?' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
      };

      (AgentModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockAgent)
      });

      mockCreate.mockResolvedValue(mockCompletion);

      await chatWithAgent(req as Request, res as Response);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Eres un asistente útil.' },
          { role: 'user', content: 'Hola' }
        ]
      });

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        agent: 'Agente Test',
        response: 'Hola, ¿en qué puedo ayudarte?',
        usage: mockCompletion.usage
      });
    });

    it('Debe retornar 500 si hay un error con OpenAI', async () => {
      req = { body: { agentId: '123', message: 'Hola' } };

      const mockAgent = {
        _id: '123',
        name: 'Agente Test',
        availability: true,
        modelVersion: 'gpt-3.5-turbo',
        instructions: 'Eres un asistente útil.'
      };

      (AgentModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockAgent)
      });

      mockCreate.mockRejectedValue(new Error('OpenAI error'));

      await chatWithAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al procesar el mensaje con la IA' });
    });

    it('Debe retornar 500 si OpenAI devuelve choices vacío (sin mensaje)', async () => {
      req = { body: { agentId: '123', message: 'Hola' } };
      const mockAgent = {
        _id: '123',
        name: 'Agente Test',
        availability: true,
        modelVersion: 'gpt-4',
        instructions: 'Eres un asistente.',
      };
      (AgentModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockAgent),
      });
      // choices[0] is undefined → completion.choices[0].message.content throws TypeError
      mockCreate.mockResolvedValue({ choices: [], usage: {} });

      await chatWithAgent(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al procesar el mensaje con la IA' });
    });
  });
});
