/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { login, signup } from '../app/auth/controller';
import { UserModel } from '../app/users/model';
import { getUsers, getUserById, updateUser, deleteUser, getFavoriteAgents, updateUserRole, updateUserStatus, addUserCredits } from '../app/users/controller';
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

  it('Debe retornar 409 si el nombre de usuario ya está registrado', async () => {
    req = { body: { name: 'NombreOcupado', email: 'libre@test.com', password: '123' } };

    // Primera llamada (email check) → null; segunda (name check) → usuario encontrado
    (UserModel.findOne as jest.Mock)
      .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) })
      .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue({ name: 'NombreOcupado' }) });

    await signup(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Nombre de usuario ya registrado' });
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

    it('Debe retornar 500 si falla la BD en getUsers', async () => {
      (UserModel.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await getUsers(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error del servidor' });
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

    it('Debe retornar 500 si falla la BD en getUserById', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' } };
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      (UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await getUserById(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error del servidor' });
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

  // ─── Login (casos adicionales) ────────────────────────────────────────────────

  describe('login() casos adicionales', () => {
    it('Debe retornar 401 si el usuario no está registrado', async () => {
      req = { body: { email: 'noexiste@test.com', password: '123' } };
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      await login(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Correo o contraseña incorrectos' });
    });

    it('Debe retornar token y datos si las credenciales son correctas', async () => {
      req = { body: { email: 'juan@test.com', password: 'password123' } };
      const mockUser = { _id: 'user123', email: 'juan@test.com', name: 'Juan', passwordHash: 'hashed', role: 'user' };
      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await login(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        token: expect.any(String),
        user: expect.objectContaining({ email: 'juan@test.com' }),
      }));
    });
  });

  // ─── deleteUser ──────────────────────────────────────────────────────────────

  describe('deleteUser()', () => {
    it('Debe retornar 400 si el ID es inválido', async () => {
      req = { params: { id: 'bad-id' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(false);

      await deleteUser(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'ID inválido' });
    });

    it('Debe retornar 404 si el usuario no existe', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      (UserModel.findByIdAndDelete as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await deleteUser(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
    });

    it('Debe retornar 204 si el usuario es eliminado exitosamente', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      const sendMock = jest.fn();
      statusMock = jest.fn().mockReturnValue({ send: sendMock });
      res = { status: statusMock, json: jsonMock, send: sendMock } as unknown as Response;
      (UserModel.findByIdAndDelete as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: '5f8d0d55b54764421b7156d9', name: 'Juan' }),
      });

      await deleteUser(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(204);
    });

    it('Debe retornar 500 si falla la BD en deleteUser', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      (UserModel.findByIdAndDelete as jest.Mock).mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await deleteUser(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error del servidor' });
    });
  });

  // ─── getFavoriteAgents ────────────────────────────────────────────────────────

  describe('getFavoriteAgents()', () => {
    it('Debe retornar la lista fija de agentes favoritos', () => {
      req = {} as unknown as Request;

      getFavoriteAgents(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        agents: expect.arrayContaining([
          expect.objectContaining({ name: expect.any(String) }),
        ]),
      }));
    });
  });

  // ─── getUserById (casos adicionales) ─────────────────────────────────────────

  describe('getUserById() casos adicionales', () => {
    it('Debe retornar 400 si el ID tiene formato inválido', async () => {
      req = { params: { id: 'no-es-un-id' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(false);

      await getUserById(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'ID inválido' });
    });

    it('Debe retornar los datos del usuario si existe', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      const mockUser = { _id: '5f8d0d55b54764421b7156d9', name: 'Juan', email: 'juan@test.com', status: 'active' };
      (UserModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser),
      });

      await getUserById(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Juan',
        email: 'juan@test.com',
      }));
    });
  });

  // ─── updateUser (casos adicionales) ──────────────────────────────────────────

  describe('updateUser() casos adicionales', () => {
    it('Debe retornar 400 si el ID es inválido', async () => {
      req = { params: { id: 'bad-id' }, body: { name: 'Nuevo' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(false);

      await updateUser(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'ID inválido' });
    });

    it('Debe retornar 409 si el email ya está en uso por otro usuario', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' }, body: { email: 'otro@test.com' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      (UserModel.findOne as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: 'otroId', email: 'otro@test.com' }),
      });

      await updateUser(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Email ya registrado' });
    });

    it('Debe retornar 200 con el usuario actualizado y un nuevo token', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' }, body: { name: 'Nombre Nuevo' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      const mockUpdated = { _id: '5f8d0d55b54764421b7156d9', name: 'Nombre Nuevo', email: 'j@test.com', role: 'user', status: 'active' };
      (UserModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUpdated),
      });

      await updateUser(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({ name: 'Nombre Nuevo' }),
        token: expect.any(String),
      }));
    });

    it('Debe retornar 404 si el usuario no existe al actualizar', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' }, body: { name: 'Nuevo' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      (UserModel.findOne as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      (UserModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await updateUser(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
    });

    it('Debe retornar 500 si falla la BD en updateUser', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' }, body: { name: 'Nuevo' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      (UserModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await updateUser(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error del servidor' });
    });
  });

  // ─── updateUserRole (casos adicionales) ──────────────────────────────────────

  describe('updateUserRole() casos adicionales', () => {
    it('Debe retornar 400 si el ID es inválido', async () => {
      req = { params: { id: 'bad-id' }, body: { role: 'admin' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(false);

      await updateUserRole(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'ID inválido' });
    });

    it('Debe retornar 400 si el rol es inválido', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' }, body: { role: 'superuser' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);

      await updateUserRole(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Rol inválido. Usa 'user' o 'admin'" });
    });

    it('Debe retornar 404 si el usuario no existe', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' }, body: { role: 'user' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      (UserModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await updateUserRole(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
    });

    it('Debe retornar 500 si falla la BD en updateUserRole', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' }, body: { role: 'admin' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      (UserModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await updateUserRole(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error del servidor' });
    });
  });

  // ─── updateUserStatus (casos adicionales) ────────────────────────────────────

  describe('updateUserStatus() casos adicionales', () => {
    it('Debe retornar 400 si el ID es inválido', async () => {
      req = { params: { id: 'bad-id' }, body: { status: 'active' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(false);

      await updateUserStatus(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'ID inválido' });
    });

    it('Debe retornar 404 si el usuario no existe', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' }, body: { status: 'blocked' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      (UserModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await updateUserStatus(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
    });

    it('Debe retornar 200 con el estado actualizado', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' }, body: { status: 'blocked' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      const mockUpdated = { _id: '5f8d0d55b54764421b7156d9', name: 'Juan', email: 'j@test.com', status: 'blocked' };
      (UserModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUpdated),
      });

      await updateUserStatus(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'blocked' }));
    });

    it('Debe retornar 500 si falla la BD en updateUserStatus', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' }, body: { status: 'active' } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      (UserModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await updateUserStatus(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error del servidor' });
    });
  });

  // ─── addUserCredits (casos adicionales) ──────────────────────────────────────

  describe('addUserCredits() casos adicionales', () => {
    it('Debe retornar 400 si el ID es inválido', async () => {
      req = { params: { id: 'bad-id' }, body: { amount: 100 } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(false);

      await addUserCredits(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'ID inválido' });
    });

    it('Debe retornar 404 si el usuario no existe', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' }, body: { amount: 100 } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      (UserModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await addUserCredits(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
    });

    it('Debe agregar créditos y retornar el total actualizado', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' }, body: { amount: 200 } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      const mockUser = { _id: '5f8d0d55b54764421b7156d9', credits: 500, save: jest.fn().mockResolvedValue(true) };
      (UserModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await addUserCredits(req as Request, res as Response);

      expect(mockUser.credits).toBe(700);
      expect(mockUser.save).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ id: expect.any(String), credits: 700 });
    });

    it('Debe retornar 500 si falla la BD en addUserCredits', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' }, body: { amount: 100 } } as unknown as Request;
      const mongoose = require('mongoose');
      mongoose.isValidObjectId = jest.fn().mockReturnValue(true);
      (UserModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await addUserCredits(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error del servidor' });
    });
  });
});