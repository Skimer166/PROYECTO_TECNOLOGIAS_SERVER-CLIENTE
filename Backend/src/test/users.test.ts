import { Request, Response } from 'express';
import { login, signup } from '../app/auth/controller';
import { UserModel } from '../app/users/model';
import { getUsers, getUserById, updateUser, updateUserRole, updateUserStatus, addUserCredits } from '../app/users/controller';
import bcrypt from 'bcryptjs';

// Mock de Mongoose
jest.mock('../app/users/model', () => ({
  UserModel: {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));
jest.mock('bcryptjs');
jest.mock('../app/mailer/controller', () => ({
  sendWelcomeEmail: jest.fn(), 
}));
jest.mock('mongoose', () => ({ 
  isValidObjectId: jest.fn(),
  Schema: jest.fn().mockImplementation(() => ({})),
  model: jest.fn()
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

    await signup(req as Request, res as Response);

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
  
      await signup(req as Request, res as Response);
  
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

    await login(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Correo o contraseña incorrectos' });
  });

  it('Debe retornar 400 si faltan campos obligatorios en el registro', async () => {
    req = { body: { name: 'Falta Email y Pass' } }; // Body incompleto

    await signup(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Rellena todos los campos" });
  });

  it('Debe retornar 409 si el email ya está registrado al intentar crear usuario', async () => {
    req = { body: { name: 'Juan', email: 'juan@test.com', password: '123' } };

    // Simulamos que findOne ya encuentra un usuario con ese correo
    (UserModel.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({ email: 'juan@test.com' })
    });

    await signup(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Email ya registrado" });
  });

  it('Debe retornar 400 en login si la cuenta fue creada con Google (sin passwordHash)', async () => {
    req = { body: { email: 'google@test.com', password: '123' } };

    // Simulamos un usuario de Google (sin passwordHash)
    (UserModel.findOne as jest.Mock).mockResolvedValue({
      email: 'google@test.com',
      googleId: '12345',
      // passwordHash aqui es undefined
    });

    await login(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ 
      message: 'Esta cuenta fue creada con Google. Inicia sesión usando "Iniciar sesión con Google".' 
    });
  });

  // PRUEBAS DE USUARIOS

  describe('Operaciones CRUD', () => {

    const { isValidObjectId } = require('mongoose');

    it('Debe listar usuarios correctamente (getUsers)', async () => {
      const mockUsers = [{ _id: '1', name: 'User 1' }, { _id: '2', name: 'User 2' }];
      
      (UserModel.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUsers)
      });

      await getUsers(req as Request, res as Response);

      expect(statusMock).not.toHaveBeenCalledWith(500); // Porque retorna directo res.json
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ users: expect.any(Array) }));
    });

    it('Debe retornar 404 si el usuario no existe por ID (getUserById)', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' } };
      
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);

      (UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null) // No lo encuentra
      });

      await getUserById(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Usuario no encontrado" });
    });

    it('Debe retornar 400 si no se envían datos para actualizar (updateUser)', async () => {
      req = { 
        params: { id: '5f8d0d55b54764421b7156d9' },
        body: {} 
      };
      
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);

      await updateUser(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Nada para actualizar" });
    });
  });

  // PRUEBAS DE ADMINISTRADOR

  describe('Operaciones de Administrador', () => {
    it('Debe actualizar el rol correctamente a admin (updateUserRole)', async () => {
      req = { 
        params: { id: '123' },
        body: { role: 'admin' }
      };

      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);

      (UserModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: '123', name: 'Test', role: 'admin' })
      });

      await updateUserRole(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }));
    });

    it('Debe rechazar la actualización de estado si es inválido (updateUserStatus)', async () => {
      req = { 
        params: { id: '123' },
        body: { status: 'StatusNoExiste' } 
      };

      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);

      await updateUserStatus(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Estado inválido. Usa 'active' o 'blocked'" });
    });

    it('Debe rechazar agregar créditos si la cantidad es inválida (addUserCredits)', async () => {
      req = { 
        params: { id: '123' },
        body: { amount: -50 } 
      };

      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);

      await addUserCredits(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Cantidad de créditos inválida' });
    });
  });
});