import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { createImageUpload, bucketName, deleteObject, getObject } from '../storage/s3';
import { FileModel } from './model';

export const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const upload = createImageUpload(MAX_SIZE_BYTES);

function getAuthUserId(req: Request): string | null {
  const user: any = (req as any).user;
  return user?.id || user?.sub || null;
}

// POST /files/upload
export async function uploadFile(req: Request, res: Response) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const file = (req as any).file as any;
    if (!file) {
      return res.status(400).json({ message: 'No se envió archivo' });
    }

    const created = await FileModel.create({
      ownerId: userId,
      key: file.key,
      bucket: file.bucket ?? bucketName,
      contentType: file.mimetype || file.contentType,
      size: file.size,
      public: false,
      originalName: file.originalname,
    });

    return res.status(201).json({
      id: created._id,
      key: created.key,
      bucket: created.bucket,
      contentType: created.contentType,
      size: created.size,
      public: created.public,
      originalName: created.originalName,
      createdAt: created.createdAt,
    });
  } catch (err) {
    console.error('Error al subir archivo:', err);
    return res.status(500).json({ message: 'Error al subir archivo' });
  }
}

// GET /files
export async function listMyFiles(req: Request, res: Response) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const files = await FileModel.find({ ownerId: userId }).lean();

    return res.json({
      files: files.map(f => ({
        id: f._id,
        key: f.key,
        bucket: f.bucket,
        contentType: f.contentType,
        size: f.size,
        public: f.public,
        originalName: f.originalName,
        createdAt: f.createdAt,
      })),
    });
  } catch (err) {
    console.error('Error al listar archivos:', err);
    return res.status(500).json({ message: 'Error al listar archivos' });
  }
}

// GET /files/:id/download
export async function downloadFile(req: Request, res: Response) {
  try {

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const file = await FileModel.findById(id).lean();
    if (!file) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    try {
      const obj = await getObject(file.key);
      const bodyStream = obj.Body as any;

      res.setHeader('Content-Type', obj.ContentType || file.contentType || 'application/octet-stream');
      if (obj.ContentLength != null) {
        res.setHeader('Content-Length', obj.ContentLength.toString());
      }
      
      const filename = file.originalName || file.key;
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

      bodyStream.pipe(res);
    } catch (err) {
      console.error('Error obteniendo archivo de S3:', err);
      return res.status(500).json({ message: 'Error al descargar archivo' });
    }
  } catch (err) {
    console.error('Error en downloadFile:', err);
    return res.status(500).json({ message: 'Error al descargar archivo' });
  }
}

// DELETE /files/:id
export async function deleteFile(req: Request, res: Response) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const file = await FileModel.findById(id).exec();
    if (!file) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    if (file.ownerId.toString() !== userId) {
      return res.status(403).json({ message: 'No puedes eliminar este archivo' });
    }

    try {
      await deleteObject(file.key);
    } catch (err) {
      console.error('Error eliminando archivo en S3, continuando con BD:', err);
    }

    await file.deleteOne();
    return res.status(204).send();
  } catch (err) {
    console.error('Error al eliminar archivo:', err);
    return res.status(500).json({ message: 'Error al eliminar archivo' });
  }
}
