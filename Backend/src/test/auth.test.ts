import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { login, forgotPassword, resetPassword, signup, googleAuthController, googleCallbackController } from '../app/auth/controller';
import { UserModel } from '../app/users/model';
import { sendPasswordResetEmail } from '../app/mailer/controller';

jest.mock('../app/users/model', () => ({
  UserModel: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));
jest.mock('../app/mailer/controller', () => ({
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../app/auth/google', () => ({
  __esModule: true,
  default: { authenticate: jest.fn() },
}));

describe('Auth Controller Unit Tests', () => {
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

  // ─── login() ─────────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('Debe retornar 401 si el correo no está registrado', async () => {
      req = { body: { email: 'noexiste@test.com', password: '123' } };
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      await login(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Correo o contraseña incorrectos' });
    });

    it('Debe retornar 400 si la cuenta fue creada con Google (sin passwordHash)', async () => {
      req = { body: { email: 'google@test.com', password: '123' } };
      (UserModel.findOne as jest.Mock).mockResolvedValue({ email: 'google@test.com', googleId: 'gid123' });

      await login(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Esta cuenta fue creada con Google. Inicia sesión usando "Iniciar sesión con Google".' });
    });

    it('Debe retornar 401 si la contraseña es incorrecta', async () => {
      req = { body: { email: 'juan@test.com', password: 'wrong' } };
      (UserModel.findOne as jest.Mock).mockResolvedValue({ email: 'juan@test.com', passwordHash: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await login(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Correo o contraseña incorrectos' });
    });

    it('Debe retornar token y datos del usuario si las credenciales son válidas', async () => {
      req = { body: { email: 'juan@test.com', password: 'password123' } };
      const mockUser = { _id: 'user123', email: 'juan@test.com', name: 'Juan', passwordHash: 'hashed', role: 'user' };
      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('fake-jwt-token');

      await login(req as Request, res as Response);

      expect(jwt.sign).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        token: 'fake-jwt-token',
        user: expect.objectContaining({ email: 'juan@test.com' }),
      }));
    });

    it('Debe retornar 500 si ocurre un error interno', async () => {
      req = { body: { email: 'juan@test.com', password: '123' } };
      (UserModel.findOne as jest.Mock).mockRejectedValue(new Error('DB error'));

      await login(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error interno del servidor' });
    });
  });

  // ─── signup() ────────────────────────────────────────────────────────────────

  describe('signup()', () => {
    beforeEach(() => {
      (UserModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
    });

    it('Debe retornar 400 si faltan campos obligatorios', async () => {
      req = { body: { email: 'test@test.com' } };

      await signup(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Rellena todos los campos' });
    });

    it('Debe retornar 400 si el formato del email es inválido', async () => {
      req = { body: { name: 'Test', email: 'correo-sin-arroba.com', password: '123' } };

      await signup(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Formato de correo inválido' });
    });

    it('Debe retornar 409 si el email ya está registrado', async () => {
      req = { body: { name: 'Test', email: 'existing@test.com', password: '123' } };
      (UserModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ email: 'existing@test.com' }),
      });

      await signup(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Email ya registrado' });
    });

    it('Debe retornar 409 si el nombre de usuario ya está registrado', async () => {
      req = { body: { name: 'UsuarioExistente', email: 'nuevo@test.com', password: '123' } };

      // First call (email check) → null, second call (name check) → user found
      (UserModel.findOne as jest.Mock)
        .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) })
        .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue({ name: 'UsuarioExistente' }) });

      await signup(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Nombre de usuario ya registrado' });
    });

    it('Debe crear el usuario correctamente y retornar 201', async () => {
      req = { body: { name: 'Nuevo Usuario', email: 'nuevo@test.com', password: 'password123' } };
      (UserModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (UserModel.create as jest.Mock).mockResolvedValue({
        _id: 'newId',
        name: 'Nuevo Usuario',
        email: 'nuevo@test.com',
      });

      await signup(req as Request, res as Response);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(UserModel.create).toHaveBeenCalledWith({
        name: 'Nuevo Usuario',
        email: 'nuevo@test.com',
        passwordHash: 'hashedPassword',
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Usuario creado correctamente',
        user: expect.objectContaining({ email: 'nuevo@test.com' }),
      });
    });

    it('Debe retornar 500 si ocurre un error interno al crear el usuario', async () => {
      req = { body: { name: 'Test', email: 'test@test.com', password: '123' } };
      (UserModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      (UserModel.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await signup(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error del servidor' });
    });
  });

  // ─── forgotPassword() ────────────────────────────────────────────────────────

  describe('forgotPassword()', () => {
    it('Debe retornar 400 si no se proporciona el email', async () => {
      req = { body: {} };

      await forgotPassword(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Email requerido' });
    });

    it('Debe retornar 200 aunque el usuario no exista (sin revelar si el email está registrado)', async () => {
      req = { body: { email: 'noexiste@test.com' } };
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      await forgotPassword(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'noexiste@test.com' });
    });

    it('Debe generar token, guardarlo y enviar el correo si el usuario existe', async () => {
      req = { body: { email: 'real@test.com' } };
      const mockUser = {
        _id: 'user123',
        email: 'real@test.com',
        name: 'Usuario Real',
        resetPasswordToken: undefined as string | undefined,
        save: jest.fn().mockResolvedValue(true),
      };
      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mocked-reset-token');
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      await forgotPassword(req as Request, res as Response);

      expect(jwt.sign).toHaveBeenCalled();
      const [payload, , options] = (jwt.sign as jest.Mock).mock.calls[0];
      expect(payload).toMatchObject({ type: 'password-reset', sub: 'user123' });
      expect(options).toMatchObject({ expiresIn: '1h' });
      expect(mockUser.resetPasswordToken).toBe('mocked-reset-token');
      expect(mockUser.save).toHaveBeenCalled();
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        'real@test.com',
        'Usuario Real',
        expect.stringContaining('mocked-reset-token')
      );
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('Debe retornar 500 si ocurre un error interno', async () => {
      req = { body: { email: 'error@test.com' } };
      (UserModel.findOne as jest.Mock).mockRejectedValue(new Error('DB error'));

      await forgotPassword(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error interno del servidor' });
    });
  });

  // ─── resetPassword() ─────────────────────────────────────────────────────────

  describe('resetPassword()', () => {
    it('Debe retornar 400 si faltan token o newPassword', async () => {
      req = { body: { token: 'some-token' } };

      await resetPassword(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Token y nueva contraseña requeridos' });
    });

    it('Debe retornar 400 si el token JWT es inválido o está expirado', async () => {
      req = { body: { token: 'bad-token', newPassword: 'newPass123' } };
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid token'); });

      await resetPassword(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Token inválido o expirado' });
    });

    it('Debe retornar 400 si el payload no es de tipo password-reset', async () => {
      req = { body: { token: 'wrong-type-token', newPassword: 'newPass123' } };
      (jwt.verify as jest.Mock).mockReturnValue({ type: 'auth', sub: 'user123' });

      await resetPassword(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Token inválido' });
    });

    it('Debe retornar 400 si el usuario no existe o el token ha expirado', async () => {
      req = { body: { token: 'good-token', newPassword: 'newPass123' } };
      (jwt.verify as jest.Mock).mockReturnValue({ type: 'password-reset', sub: 'user123' });
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      await resetPassword(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Token inválido o expirado' });
    });

    it('Debe retornar 400 si la fecha de expiración del token ya pasó', async () => {
      req = { body: { token: 'expired-token', newPassword: 'newPass123' } };
      (jwt.verify as jest.Mock).mockReturnValue({ type: 'password-reset', sub: 'user123' });
      const mockUser = {
        _id: 'user123',
        resetPasswordToken: 'expired-token',
        resetPasswordExpires: new Date(Date.now() - 10000), // expired
        save: jest.fn(),
      };
      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);

      await resetPassword(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Token inválido o expirado' });
    });

    it('Debe actualizar la contraseña y retornar 200 si todo es correcto', async () => {
      req = { body: { token: 'good-token', newPassword: 'newPass123' } };
      const mockUser = {
        _id: 'user123',
        resetPasswordToken: 'good-token',
        resetPasswordExpires: new Date(Date.now() + 3600000),
        passwordHash: 'oldHash',
        save: jest.fn().mockResolvedValue(true),
      };
      (jwt.verify as jest.Mock).mockReturnValue({ type: 'password-reset', sub: 'user123' });
      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      await resetPassword(req as Request, res as Response);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPass123', 10);
      expect(mockUser.passwordHash).toBe('newHashedPassword');
      expect(mockUser.resetPasswordToken).toBeUndefined();
      expect(mockUser.resetPasswordExpires).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Contraseña actualizada correctamente' });
    });

    it('Debe retornar 500 si ocurre un error interno', async () => {
      req = { body: { token: 'some-token', newPassword: 'pass123' } };
      (jwt.verify as jest.Mock).mockReturnValue({ type: 'password-reset', sub: 'user123' });
      (UserModel.findOne as jest.Mock).mockRejectedValue(new Error('DB error'));

      await resetPassword(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error interno del servidor' });
    });
  });

  // ─── googleAuthController() ───────────────────────────────────────────────────

  describe('googleAuthController()', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const passportMock = require('../app/auth/google').default as { authenticate: jest.Mock };

    beforeEach(() => {
      // restoreMocks: true resets authenticate to undefined; re-assign a fresh jest.fn()
      passportMock.authenticate = jest.fn();
    });

    it('Debe llamar a passport.authenticate con state=register si mode=register', () => {
      req = { query: { mode: 'register' } } as unknown as Request;
      const next = jest.fn() as unknown as import('express').NextFunction;
      const authFn = jest.fn();
      passportMock.authenticate.mockReturnValue(authFn);

      googleAuthController(req as Request, res as Response, next);

      expect(passportMock.authenticate).toHaveBeenCalledWith('google', expect.objectContaining({ state: 'register' }));
      expect(authFn).toHaveBeenCalledWith(req, res, next);
    });

    it('Debe usar state=login por defecto si mode no es register', () => {
      req = { query: {} } as unknown as Request;
      const next = jest.fn() as unknown as import('express').NextFunction;
      passportMock.authenticate.mockReturnValue(jest.fn());

      googleAuthController(req as Request, res as Response, next);

      expect(passportMock.authenticate).toHaveBeenCalledWith('google', expect.objectContaining({ state: 'login' }));
    });

    it('Debe incluir scope profile y email en la llamada a passport.authenticate', () => {
      req = { query: {} } as unknown as Request;
      const next = jest.fn() as unknown as import('express').NextFunction;
      passportMock.authenticate.mockReturnValue(jest.fn());

      googleAuthController(req as Request, res as Response, next);

      expect(passportMock.authenticate).toHaveBeenCalledWith('google', expect.objectContaining({
        scope: ['profile', 'email'],
        session: false,
      }));
    });
  });

  // ─── googleCallbackController() ───────────────────────────────────────────────

  describe('googleCallbackController()', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const passportMock = require('../app/auth/google').default as { authenticate: jest.Mock };
    let redirectMock: jest.Mock;
    let next: import('express').NextFunction;

    beforeEach(() => {
      // restoreMocks: true resets authenticate to undefined; re-assign a fresh jest.fn()
      passportMock.authenticate = jest.fn();
      redirectMock = jest.fn();
      res = { redirect: redirectMock } as unknown as Response;
      next = jest.fn() as unknown as import('express').NextFunction;
    });

    const callWithCallback = (
      err: Error | null,
      googleUser: unknown,
      info?: { isNewUser?: boolean }
    ) => {
      passportMock.authenticate.mockImplementation(
        (_strategy: string, _opts: unknown, callback: Function) =>
          (_req: Request, _res: Response, _next: import('express').NextFunction) =>
            callback(err, googleUser, info)
      );
    };

    it('Debe redirigir a /login?error=google_auth_failed si hay un error de autenticación', () => {
      req = { query: {} } as unknown as Request;
      callWithCallback(new Error('oauth error'), null);

      googleCallbackController(req as Request, res as Response, next);

      expect(redirectMock).toHaveBeenCalledWith(expect.stringContaining('google_auth_failed'));
    });

    it('Debe redirigir a /login?error=google_auth_failed si googleUser es falso', () => {
      req = { query: {} } as unknown as Request;
      callWithCallback(null, false);

      googleCallbackController(req as Request, res as Response, next);

      expect(redirectMock).toHaveBeenCalledWith(expect.stringContaining('google_auth_failed'));
    });

    it('Debe redirigir a /register?error=email_already_used en modo register si el usuario ya existía', () => {
      req = { query: { state: 'register' } } as unknown as Request;
      const googleUser = { _id: 'u1', email: 'a@b.com', role: 'user', name: 'Test' };
      callWithCallback(null, googleUser, { isNewUser: false });

      googleCallbackController(req as Request, res as Response, next);

      expect(redirectMock).toHaveBeenCalledWith(expect.stringContaining('email_already_used'));
    });

    it('Debe redirigir a /login/success?token=... con un JWT válido en login mode', () => {
      req = { query: {} } as unknown as Request;
      const googleUser = { _id: 'u1', email: 'a@b.com', role: 'user', name: 'Test', avatar: '', credits: 0 };
      callWithCallback(null, googleUser, { isNewUser: false });
      (jwt.sign as jest.Mock).mockReturnValue('google-jwt-token');

      googleCallbackController(req as Request, res as Response, next);

      expect(jwt.sign).toHaveBeenCalled();
      expect(redirectMock).toHaveBeenCalledWith(expect.stringContaining('google-jwt-token'));
    });

    it('Debe redirigir a /login?error=server_error si jwt.sign lanza una excepción', () => {
      req = { query: {} } as unknown as Request;
      const googleUser = { _id: 'u1', email: 'a@b.com', role: 'user', name: 'Test' };
      callWithCallback(null, googleUser, { isNewUser: false });
      (jwt.sign as jest.Mock).mockImplementation(() => { throw new Error('sign error'); });

      googleCallbackController(req as Request, res as Response, next);

      expect(redirectMock).toHaveBeenCalledWith(expect.stringContaining('server_error'));
    });
  });
});
