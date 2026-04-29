jest.mock('../app/users/model', () => ({
  UserModel: {
    findById: jest.fn(),
  },
}));

jest.mock('jsonwebtoken');

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, verifyToken, verifyAdmin } from '../app/middlewares/auth';
import { UserModel } from '../app/users/model';

describe('Auth Middleware Unit Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    sendMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock, send: sendMock });
    next = jest.fn();
    res = {
      status: statusMock,
      json: jsonMock,
      send: sendMock,
    } as unknown as Response;
  });

  // ─── authMiddleware ───────────────────────────────────────────────────────────

  describe('authMiddleware()', () => {
    it('Debe retornar 401 si no se proporciona token', () => {
      req = { query: {} } as unknown as Request;

      authMiddleware(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(sendMock).toHaveBeenCalledWith({ mensaje: 'token faltante' });
      expect(next).not.toHaveBeenCalled();
    });

    it('Debe pasar con el token especial Bearer1234', () => {
      req = { query: { token: 'Bearer1234' } } as unknown as Request;

      authMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('Debe retornar 401 si el JWT es inválido', () => {
      req = { query: { token: 'invalid.jwt.token' } } as unknown as Request;
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('Invalid'); });

      authMiddleware(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(sendMock).toHaveBeenCalledWith({ mensaje: 'token inválido o expirado' });
      expect(next).not.toHaveBeenCalled();
    });

    it('Debe llamar a next() con un JWT válido', () => {
      req = { query: { token: 'valid.jwt.token' } } as unknown as Request;
      (jwt.verify as jest.Mock).mockReturnValue({ name: 'Juan', email: 'juan@test.com' });

      authMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect((req as Request).user).toBeDefined();
    });

    it('Debe extraer el token quitando el prefijo "Bearer "', () => {
      req = { query: { token: 'Bearer valid.jwt.token' } } as unknown as Request;
      (jwt.verify as jest.Mock).mockReturnValue({ name: 'Juan', email: 'juan@test.com' });

      authMiddleware(req as Request, res as Response, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid.jwt.token', expect.anything());
      expect(next).toHaveBeenCalled();
    });
  });

  // ─── verifyToken ──────────────────────────────────────────────────────────────

  describe('verifyToken()', () => {
    it('Debe retornar 401 si no se proporciona header Authorization', async () => {
      req = { headers: {} } as unknown as Request;

      await verifyToken(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Required token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('Debe retornar 401 si el header no contiene token después de split', async () => {
      req = { headers: { authorization: 'Bearer' } } as unknown as Request;

      await verifyToken(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Required token' });
    });

    it('Debe retornar 401 si el JWT es inválido', async () => {
      req = { headers: { authorization: 'Bearer invalid.token' } } as unknown as Request;
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('Invalid'); });

      await verifyToken(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid token' });
    });

    it('Debe retornar 401 si el JWT expiró', async () => {
      req = { headers: { authorization: 'Bearer expired.token' } } as unknown as Request;
      const expiredError = new Error('TokenExpiredError');
      expiredError.name = 'TokenExpiredError';
      (jwt.verify as jest.Mock).mockImplementation(() => { throw expiredError; });

      await verifyToken(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Token expirado, inicia sesión de nuevo' });
    });

    it('Debe retornar 401 si el payload no contiene sub ni id', async () => {
      req = { headers: { authorization: 'Bearer valid.token' } } as unknown as Request;
      (jwt.verify as jest.Mock).mockReturnValue({ email: 'test@test.com' }); // sin sub ni id

      await verifyToken(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid token payload' });
    });

    it('Debe retornar 401 si el usuario no existe en BD', async () => {
      req = { headers: { authorization: 'Bearer valid.token' } } as unknown as Request;
      (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user123' });
      (UserModel.findById as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

      await verifyToken(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
    });

    it('Debe retornar 403 si el usuario está bloqueado', async () => {
      req = { headers: { authorization: 'Bearer valid.token' } } as unknown as Request;
      (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user123' });
      (UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'user123', status: 'blocked', role: 'user', email: 'u@t.com', name: 'Test' })
      });

      await verifyToken(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Tu cuenta está bloqueada. Contacta al administrador.' });
    });

    it('Debe llamar a next() y poner req.user si el token y usuario son válidos', async () => {
      req = { headers: { authorization: 'Bearer valid.token' } } as unknown as Request;
      (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user123' });
      (UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'user123', status: 'active', role: 'user', email: 'u@t.com', name: 'Test' })
      });

      await verifyToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect((req as Request).user).toBeDefined();
      expect((req as Request).user?.email).toBe('u@t.com');
    });
  });

  // ─── verifyAdmin ──────────────────────────────────────────────────────────────

  describe('verifyAdmin()', () => {
    it('Debe retornar 401 si req.user no está definido', () => {
      req = { user: undefined } as unknown as Request;

      verifyAdmin(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Required token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('Debe retornar 403 si el usuario no es admin', () => {
      req = { user: { role: 'user', id: 'user123' } } as unknown as Request;

      verifyAdmin(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Admin access required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('Debe llamar a next() si el usuario es admin', () => {
      req = { user: { role: 'admin', id: 'admin123' } } as unknown as Request;

      verifyAdmin(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
