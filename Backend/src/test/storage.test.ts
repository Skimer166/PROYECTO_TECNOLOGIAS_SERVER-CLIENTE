const mockS3Send = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockS3Send })),
  PutObjectCommand: jest.fn().mockImplementation((params) => ({ ...params, _type: 'PutObject' })),
  DeleteObjectCommand: jest.fn().mockImplementation((params) => ({ ...params, _type: 'DeleteObject' })),
  GetObjectCommand: jest.fn().mockImplementation((params) => ({ ...params, _type: 'GetObject' })),
}));

jest.mock('multer', () => {
  const multerFn = jest.fn().mockReturnValue({ single: jest.fn() });
  return multerFn;
});

jest.mock('multer-s3', () => {
  const multerS3Fn = jest.fn().mockReturnValue({}) as jest.Mock & { AUTO_CONTENT_TYPE: jest.Mock };
  multerS3Fn.AUTO_CONTENT_TYPE = jest.fn();
  return multerS3Fn;
});

jest.mock('dotenv', () => ({ config: jest.fn() }));

// Importar con S3_BUCKET configurado para los tests de happy path
process.env.S3_BUCKET = 'test-bucket';
process.env.S3_REGION = 'us-east-1';
process.env.S3_ACCESS_KEY = 'test-key';
process.env.S3_SECRET_KEY = 'test-secret';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const s3Module = require('../app/storage/s3');

describe('Storage (S3) Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── bucketName ───────────────────────────────────────────────────────────────

  describe('bucketName', () => {
    it('Debe exportar bucketName como string', () => {
      expect(typeof s3Module.bucketName).toBe('string');
    });

    it('Debe leer el nombre del bucket desde S3_BUCKET al cargar el módulo', () => {
      expect(s3Module.bucketName).toBe('test-bucket');
    });
  });

  // ─── deleteObject ─────────────────────────────────────────────────────────────

  describe('deleteObject()', () => {
    it('Debe lanzar error si S3_BUCKET no está configurado', async () => {
      jest.resetModules();
      process.env.S3_BUCKET = '';
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { deleteObject } = require('../app/storage/s3');

      await expect(deleteObject('some-key')).rejects.toThrow('S3_BUCKET no configurado');

      process.env.S3_BUCKET = 'test-bucket';
      jest.restoreAllMocks();
    });

    it('Debe llamar a s3Client.send con DeleteObjectCommand', async () => {
      mockS3Send.mockResolvedValue({});

      await s3Module.deleteObject('documents/user/file.png');

      expect(mockS3Send).toHaveBeenCalled();
    });

    it('Debe propagar el error si s3Client.send falla', async () => {
      mockS3Send.mockRejectedValue(new Error('S3 connection error'));

      await expect(s3Module.deleteObject('some-key')).rejects.toThrow('S3 connection error');
    });
  });

  // ─── getObject ────────────────────────────────────────────────────────────────

  describe('getObject()', () => {
    it('Debe lanzar error si S3_BUCKET no está configurado', async () => {
      jest.resetModules();
      process.env.S3_BUCKET = '';
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getObject } = require('../app/storage/s3');

      await expect(getObject('some-key')).rejects.toThrow('S3_BUCKET no configurado');

      process.env.S3_BUCKET = 'test-bucket';
      jest.restoreAllMocks();
    });

    it('Debe llamar a s3Client.send con GetObjectCommand y retornar respuesta', async () => {
      const mockResponse = { Body: 'stream', ContentType: 'image/png', ContentLength: 1024 };
      mockS3Send.mockResolvedValue(mockResponse);

      const result = await s3Module.getObject('documents/user/img.png');

      expect(mockS3Send).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('Debe propagar el error si s3Client.send falla', async () => {
      mockS3Send.mockRejectedValue(new Error('NoSuchKey'));

      await expect(s3Module.getObject('missing-key')).rejects.toThrow('NoSuchKey');
    });
  });

  // ─── uploadBuffer ─────────────────────────────────────────────────────────────

  describe('uploadBuffer()', () => {
    it('Debe lanzar error si S3_BUCKET no está configurado', async () => {
      jest.resetModules();
      process.env.S3_BUCKET = '';
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { uploadBuffer } = require('../app/storage/s3');
      const buf = Buffer.from('test');

      await expect(uploadBuffer('key', buf, 'image/png')).rejects.toThrow('S3_BUCKET no configurado');

      process.env.S3_BUCKET = 'test-bucket';
      jest.restoreAllMocks();
    });

    it('Debe llamar a s3Client.send con PutObjectCommand', async () => {
      mockS3Send.mockResolvedValue({});
      const buf = Buffer.from('test data');

      await s3Module.uploadBuffer('documents/file.png', buf, 'image/png');

      expect(mockS3Send).toHaveBeenCalled();
    });
  });

  // ─── s3Client (alias s3) ──────────────────────────────────────────────────────

  describe('s3Client / s3', () => {
    it('Debe exportar s3Client y s3 como el mismo objeto', () => {
      expect(s3Module.s3).toBe(s3Module.s3Client);
    });
  });

  // ─── createImageUpload ────────────────────────────────────────────────────────

  describe('createImageUpload()', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const multerMock = require('multer') as jest.Mock;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const multerS3Mock = require('multer-s3') as jest.Mock & { AUTO_CONTENT_TYPE: jest.Mock };

    beforeEach(() => {
      // resetMocks/restoreMocks clear implementations; re-apply so multer() returns a usable object
      multerMock.mockReturnValue({ single: jest.fn() });
      multerS3Mock.mockReturnValue({});
      multerS3Mock.AUTO_CONTENT_TYPE = jest.fn();
    });

    it('Debe retornar un middleware de multer (objeto definido)', () => {
      const upload = s3Module.createImageUpload();
      expect(upload).toBeDefined();
    });

    it('Debe usar el límite por defecto de 5 MB si no se pasa argumento', () => {
      s3Module.createImageUpload();
      expect(multerMock).toHaveBeenCalledWith(
        expect.objectContaining({ limits: { fileSize: 5 * 1024 * 1024 } })
      );
    });

    it('Debe usar el límite especificado cuando se pasa como argumento', () => {
      const twoMB = 2 * 1024 * 1024;
      s3Module.createImageUpload(twoMB);
      expect(multerMock).toHaveBeenCalledWith(
        expect.objectContaining({ limits: { fileSize: twoMB } })
      );
    });

    it('Debe configurar multerS3 con AUTO_CONTENT_TYPE', () => {
      s3Module.createImageUpload();
      expect(multerS3Mock).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: multerS3Mock.AUTO_CONTENT_TYPE })
      );
    });
  });
});
