import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { forgotPassword, resetPassword, signup } from '../app/auth/controller';
import { UserModel } from '../app/users/model';
import { sendPasswordResetEmail } from '../app/mailer/controller';

jest.mock('../app/users/model');
jest.mock('../app/mailer/controller');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('Auth Controller Unit Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Limpiamos los mocks antes de cada prueba para evitar que se contaminen
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
      json: jsonMock,
    } as unknown as Response;
  });

  describe('signup()', () => {
    it('Debe retornar 501 indicando que no está implementado', () => {
      req = { body: {} };

      signup(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(501);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'No implementado. Usa /users/register' });
    });
  });

  describe('forgotPassword()', () => {
    it('Debe retornar 400 si no se proporciona un email', async () => {
      req = { body: {} }; // Body sin email

      await forgotPassword(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Email requerido' });
    });

    it('Debe retornar 200 y NO enviar correo si el usuario no existe', async () => {
      req = { body: { email: 'fantasma@test.com' } };

      // Simulamos que la BD no encuentra al usuario
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      await forgotPassword(req as Request, res as Response);

      expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'fantasma@test.com' });
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
      // En tu controlador devuelves 200 de todas formas por seguridad (evita enumeración de usuarios)
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('Debe retornar 200 y enviar el correo si el usuario existe', async () => {
      req = { body: { email: 'real@test.com', token: 'mockToken123' } }; // Basado en tu código actual

      const mockUser = { email: 'real@test.com', name: 'Usuario Real' };
      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(true);

      await forgotPassword(req as Request, res as Response);

      expect(sendPasswordResetEmail).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('resetPassword()', () => {
    it('Debe retornar 400 si falta el token o la nueva contraseña', async () => {
      req = { body: { token: 'solo-token' } }; // Falta newPassword

      await resetPassword(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Token y nueva contraseña requeridos' });
    });

    it('Debe retornar 400 si el JWT es inválido o expiró', async () => {
      req = { body: { token: 'bad-token', newPassword: 'newPass123' } };

      // Simulamos que jwt.verify lanza un error
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await resetPassword(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Token inválido o expirado' });
    });

    it('Debe actualizar la contraseña exitosamente si todo es correcto', async () => {
      req = { body: { token: 'good-token', newPassword: 'newPass123' } };

      const mockPayload = { type: 'password-reset', sub: 'user123' };
      const mockUser = {
        _id: 'user123',
        resetPasswordExpires: new Date(Date.now() + 10000), // Válido en el futuro
        save: jest.fn().mockResolvedValue(true)
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

      await resetPassword(req as Request, res as Response);

      // Verificamos que se haya encriptado la nueva contraseña
      expect(bcrypt.hash).toHaveBeenCalledWith('newPass123', 10);
      // Verificamos que se haya guardado el usuario
      expect(mockUser.save).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Contraseña actualizada correctamente' });
    });
  });
});