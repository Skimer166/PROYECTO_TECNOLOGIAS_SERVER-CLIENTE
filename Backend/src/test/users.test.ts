import { Request, Response } from 'express';
import { postUsers, loginUser } from '../app/users/controller';
import { UserModel } from '../app/users/model';
import bcrypt from 'bcryptjs';

// Mock de Mongoose
jest.mock('../app/users/model');
jest.mock('bcryptjs');
jest.mock('../app/mailer/controller', () => ({
  sendWelcomeEmail: jest.fn(), 
}));

describe('User Controller Unit Tests', () => {
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

  // PRUEBA 1: Verificar entradas de datos para register
  it('Debe retornar 400 si el correo tiene un formato inválido', async () => {
    req = {
      body: {
        name: 'Test User',
        email: 'correo-malo', 
        password: '123'
      }
    };

    await postUsers(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Formato de correo inválido" });
  });

  // PRUEBA 2: Mock de datos exitoso para register
  it('Debe crear un usuario correctamente y retornar 201', async () => {
    req = {
      body: {
        name: 'Juan Perez',
        email: 'juan@test.com',
        password: 'password123'
      }
    };

    (UserModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null) 
      });

      // Simular el hash
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      
      // Simular la creación
      (UserModel.create as jest.Mock).mockResolvedValue({
        _id: 'mockId123',
        name: 'Juan Perez',
        email: 'juan@test.com'
      });
  
      await postUsers(req as Request, res as Response);
  
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        message: "Usuario creado correctamente",
        user: expect.objectContaining({ email: 'juan@test.com' })
      }));
  });

  // PRUEBA 3: Verificar Endpoint de Login con contraseña incorrecta
  it('Debe retornar 401 si la contraseña es incorrecta en el login', async () => {
    req = {
      body: {
        email: 'juan@test.com',
        password: 'wrongpassword'
      }
    };

    // Simulamos que encuentra al usuario
    (UserModel.findOne as jest.Mock).mockResolvedValue({
      email: 'juan@test.com',
      passwordHash: 'hashed_real_password'
    });
    // Simulamos que la comparacion de contraseñas falla
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await loginUser(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Correo o contraseña incorrectos' });
  });
});