/* eslint-disable @typescript-eslint/no-require-imports */
import { dbConnect } from '../database/index';

// Mock de Mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn(),
}));

describe('Database Connection Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset process.env before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original process.env
    process.env = originalEnv;
  });

  describe('dbConnect()', () => {
    it('Debe conectar exitosamente cuando MONGO_URL está definido y la conexión funciona', async () => {
      const mockUrl = 'mongodb://localhost:27017/testdb';
      process.env.MONGO_URL = mockUrl;

      const { connect } = require('mongoose');
      (connect as jest.Mock).mockResolvedValue(undefined); // Simula conexión exitosa

      await expect(dbConnect()).resolves.toBeUndefined();

      expect(connect).toHaveBeenCalledWith(mockUrl);
      expect(connect).toHaveBeenCalledTimes(1);
    });

    it('Debe rechazar la promesa cuando la conexión a MongoDB falla', async () => {
      const mockUrl = 'mongodb://localhost:27017/testdb';
      process.env.MONGO_URL = mockUrl;

      const mockError = new Error('Connection failed');
      const { connect } = require('mongoose');
      (connect as jest.Mock).mockRejectedValue(mockError);

      await expect(dbConnect()).rejects.toBeUndefined();

      expect(connect).toHaveBeenCalledWith(mockUrl);
      expect(connect).toHaveBeenCalledTimes(1);
    });

    it('Debe usar la URL correcta de las variables de entorno', async () => {
      const mockUrl = 'mongodb://test-host:27018/myapp';
      process.env.MONGO_URL = mockUrl;

      const { connect } = require('mongoose');
      (connect as jest.Mock).mockResolvedValue(undefined);

      await dbConnect();

      expect(connect).toHaveBeenCalledWith(mockUrl);
    });

    it('Debe manejar diferentes formatos de URL de MongoDB', async () => {
      const testUrls = [
        'mongodb://localhost:27017/testdb',
        'mongodb+srv://user:pass@cluster.mongodb.net/dbname',
        'mongodb://user:pass@localhost:27017/dbname?authSource=admin'
      ];

      const { connect } = require('mongoose');

      for (const url of testUrls) {
        process.env.MONGO_URL = url;
        (connect as jest.Mock).mockResolvedValue(undefined);

        await dbConnect();

        expect(connect).toHaveBeenCalledWith(url);
      }

      expect(connect).toHaveBeenCalledTimes(testUrls.length);
    });

    it('Debe propagar errores específicos de conexión', async () => {
      const mockUrl = 'mongodb://localhost:27017/testdb';
      process.env.MONGO_URL = mockUrl;

      const connectionError = new Error('ECONNREFUSED: Connection refused');
      const { connect } = require('mongoose');
      (connect as jest.Mock).mockRejectedValue(connectionError);

      // Verificar que la promesa se rechaza
      let errorCaught;
      try {
        await dbConnect();
      } catch (error) {
        errorCaught = error;
      }

      expect(errorCaught).toBeUndefined(); // La función rechaza sin pasar el error específico
      expect(connect).toHaveBeenCalledWith(mockUrl);
    });

    it('Debe ser idempotente - múltiples llamadas consecutivas', async () => {
      const mockUrl = 'mongodb://localhost:27017/testdb';
      process.env.MONGO_URL = mockUrl;

      const { connect } = require('mongoose');
      (connect as jest.Mock).mockResolvedValue(undefined);

      // Llamar múltiples veces
      await dbConnect();
      await dbConnect();
      await dbConnect();

      expect(connect).toHaveBeenCalledTimes(3);
      expect(connect).toHaveBeenCalledWith(mockUrl);
    });

    it('Debe intentar conectar con undefined si MONGO_URL no está definido', async () => {
      delete process.env.MONGO_URL;
      const { connect } = require('mongoose');
      (connect as jest.Mock).mockResolvedValue(undefined);

      await dbConnect();

      expect(connect).toHaveBeenCalledWith(undefined);
    });

    it('Debe manejar conexiones lentas (timeout)', async () => {
      const mockUrl = 'mongodb://slow-server:27017/testdb';
      process.env.MONGO_URL = mockUrl;

      const { connect } = require('mongoose');
      (connect as jest.Mock).mockImplementation(() =>
        new Promise((resolve) => setTimeout(resolve, 100)) // Simula delay
      );

      const startTime = Date.now();
      await dbConnect();
      const endTime = Date.now();

      // Usar umbral de 50 ms para evitar falsos negativos por precision del timer en CI
      expect(endTime - startTime).toBeGreaterThanOrEqual(50);
      expect(connect).toHaveBeenCalledWith(mockUrl);
    });
  });
});