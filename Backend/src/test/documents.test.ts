jest.mock('../app/storage/s3', () => ({
  createImageUpload: jest.fn().mockReturnValue(jest.fn()),
  bucketName: 'test-bucket',
  deleteObject: jest.fn(),
  getObject: jest.fn(),
}));

jest.mock('../app/documents/model', () => ({
  FileModel: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('mongoose', () => ({
  isValidObjectId: jest.fn(),
  Schema: jest.fn().mockImplementation(() => ({ index: jest.fn() })),
  model: jest.fn(),
  Types: { ObjectId: jest.fn() },
}));

import { Request, Response } from 'express';
import { uploadFile, listMyFiles, downloadFile, deleteFile } from '../app/documents/controller';
import { FileModel } from '../app/documents/model';
import { deleteObject, getObject } from '../app/storage/s3';
import { isValidObjectId } from 'mongoose';

describe('Documents Controller Unit Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;
  let setHeaderMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    sendMock = jest.fn();
    setHeaderMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock, send: sendMock });
    res = {
      status: statusMock,
      json: jsonMock,
      send: sendMock,
      setHeader: setHeaderMock,
    } as unknown as Response;
  });

  // ─── uploadFile ──────────────────────────────────────────────────────────────

  describe('uploadFile()', () => {
    it('Debe retornar 401 si no hay usuario autenticado', async () => {
      req = { body: {}, user: undefined };

      await uploadFile(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'No autorizado' });
    });

    it('Debe retornar 400 si no se envió archivo', async () => {
      req = { user: { id: 'user123' }, file: undefined } as unknown as Request;

      await uploadFile(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'No se envió archivo' });
    });

    it('Debe retornar 201 con los datos del archivo creado', async () => {
      const mockFile = {
        key: 'documents/user123/1234.png',
        bucket: 'test-bucket',
        mimetype: 'image/png',
        size: 1024,
        originalname: 'foto.png',
        contentType: 'image/png',
      };
      const mockCreated = {
        _id: 'fileId1',
        key: mockFile.key,
        bucket: mockFile.bucket,
        contentType: mockFile.mimetype,
        size: mockFile.size,
        public: false,
        originalName: mockFile.originalname,
        createdAt: new Date(),
      };

      req = {
        user: { id: 'user123' },
        file: mockFile,
      } as unknown as Request;

      (FileModel.create as jest.Mock).mockResolvedValue(mockCreated);

      await uploadFile(req as Request, res as Response);

      expect(FileModel.create).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        key: mockFile.key,
        bucket: mockFile.bucket,
      }));
    });

    it('Debe retornar 500 si FileModel.create lanza error', async () => {
      req = {
        user: { id: 'user123' },
        file: { key: 'k', bucket: 'b', mimetype: 'image/png', size: 1, originalname: 'a.png' },
      } as unknown as Request;

      (FileModel.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await uploadFile(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al subir archivo' });
    });
  });

  // ─── listMyFiles ─────────────────────────────────────────────────────────────

  describe('listMyFiles()', () => {
    it('Debe retornar 401 si no hay usuario autenticado', async () => {
      req = { user: undefined } as unknown as Request;

      await listMyFiles(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'No autorizado' });
    });

    it('Debe retornar lista de archivos del usuario', async () => {
      req = { user: { id: 'user123' } } as unknown as Request;
      const mockFiles = [
        { _id: 'f1', key: 'k1', bucket: 'b', contentType: 'image/png', size: 100, public: false, originalName: 'a.png', createdAt: new Date() },
      ];
      (FileModel.find as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(mockFiles) });

      await listMyFiles(req as Request, res as Response);

      expect(FileModel.find).toHaveBeenCalledWith({ ownerId: 'user123' });
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ files: expect.any(Array) }));
    });

    it('Debe retornar 500 si FileModel.find lanza error', async () => {
      req = { user: { id: 'user123' } } as unknown as Request;
      (FileModel.find as jest.Mock).mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('DB error')) });

      await listMyFiles(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al listar archivos' });
    });
  });

  // ─── downloadFile ─────────────────────────────────────────────────────────────

  describe('downloadFile()', () => {
    it('Debe retornar 400 si el ID es inválido', async () => {
      req = { params: { id: 'bad-id' } } as unknown as Request;
      (isValidObjectId as jest.Mock).mockReturnValue(false);

      await downloadFile(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'ID inválido' });
    });

    it('Debe retornar 404 si el archivo no existe en BD', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' } } as unknown as Request;
      (isValidObjectId as jest.Mock).mockReturnValue(true);
      (FileModel.findById as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

      await downloadFile(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Archivo no encontrado' });
    });

    it('Debe retornar 500 si S3 getObject falla', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' } } as unknown as Request;
      (isValidObjectId as jest.Mock).mockReturnValue(true);
      const mockFile = { key: 'documents/user123/file.png', originalName: 'file.png', contentType: 'image/png' };
      (FileModel.findById as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(mockFile) });
      (getObject as jest.Mock).mockRejectedValue(new Error('S3 error'));

      await downloadFile(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al descargar archivo' });
    });

    it('Debe hacer pipe del stream si todo es correcto', async () => {
      req = { params: { id: '5f8d0d55b54764421b7156d9' } } as unknown as Request;
      (isValidObjectId as jest.Mock).mockReturnValue(true);
      const mockFile = { key: 'documents/user123/file.png', originalName: 'file.png', contentType: 'image/png' };
      (FileModel.findById as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(mockFile) });
      const pipeMock = jest.fn();
      (getObject as jest.Mock).mockResolvedValue({
        Body: { pipe: pipeMock },
        ContentType: 'image/png',
        ContentLength: 1024,
      });

      await downloadFile(req as Request, res as Response);

      expect(setHeaderMock).toHaveBeenCalledWith('Content-Type', 'image/png');
      expect(pipeMock).toHaveBeenCalledWith(res);
    });
  });

  // ─── deleteFile ───────────────────────────────────────────────────────────────

  describe('deleteFile()', () => {
    it('Debe retornar 401 si no hay usuario autenticado', async () => {
      req = { user: undefined, params: { id: '5f8d0d55b54764421b7156d9' } } as unknown as Request;

      await deleteFile(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'No autorizado' });
    });

    it('Debe retornar 400 si el ID es inválido', async () => {
      req = { user: { id: 'user123' }, params: { id: 'bad-id' } } as unknown as Request;
      (isValidObjectId as jest.Mock).mockReturnValue(false);

      await deleteFile(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'ID inválido' });
    });

    it('Debe retornar 404 si el archivo no existe', async () => {
      req = { user: { id: 'user123' }, params: { id: '5f8d0d55b54764421b7156d9' } } as unknown as Request;
      (isValidObjectId as jest.Mock).mockReturnValue(true);
      (FileModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await deleteFile(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Archivo no encontrado' });
    });

    it('Debe retornar 403 si el usuario no es el dueño', async () => {
      req = { user: { id: 'user123' }, params: { id: '5f8d0d55b54764421b7156d9' } } as unknown as Request;
      (isValidObjectId as jest.Mock).mockReturnValue(true);
      const mockFile = { ownerId: { toString: () => 'otroUser' }, key: 'k', deleteOne: jest.fn() };
      (FileModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockFile) });

      await deleteFile(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'No puedes eliminar este archivo' });
    });

    it('Debe retornar 204 si elimina exitosamente', async () => {
      req = { user: { id: 'user123' }, params: { id: '5f8d0d55b54764421b7156d9' } } as unknown as Request;
      (isValidObjectId as jest.Mock).mockReturnValue(true);
      const mockFile = { ownerId: { toString: () => 'user123' }, key: 'k', deleteOne: jest.fn().mockResolvedValue(true) };
      (FileModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockFile) });
      (deleteObject as jest.Mock).mockResolvedValue(undefined);

      await deleteFile(req as Request, res as Response);

      expect(deleteObject).toHaveBeenCalledWith('k');
      expect(mockFile.deleteOne).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(204);
    });

    it('Debe eliminar el registro en BD aunque S3 falle', async () => {
      req = { user: { id: 'user123' }, params: { id: '5f8d0d55b54764421b7156d9' } } as unknown as Request;
      (isValidObjectId as jest.Mock).mockReturnValue(true);
      const mockFile = { ownerId: { toString: () => 'user123' }, key: 'k', deleteOne: jest.fn().mockResolvedValue(true) };
      (FileModel.findById as jest.Mock).mockReturnValue({ exec: jest.fn().mockResolvedValue(mockFile) });
      (deleteObject as jest.Mock).mockRejectedValue(new Error('S3 error'));

      await deleteFile(req as Request, res as Response);

      expect(mockFile.deleteOne).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(204);
    });
  });
});
