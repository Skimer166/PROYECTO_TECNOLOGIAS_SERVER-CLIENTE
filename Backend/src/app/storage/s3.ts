import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import dotenv from 'dotenv';

dotenv.config();

// --- 1. CONFIGURACIÓN BASE ---
export const bucketName = process.env.S3_BUCKET || '';
const region = process.env.S3_REGION;
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;

export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!
  }
});

// Alias para compatibilidad con código antiguo
export const s3 = s3Client; 

// --- 2. FUNCIONES HELPERS (Restauradas para Documents) ---

export async function deleteObject(key: string) {
  if (!bucketName) throw new Error('S3_BUCKET no configurado');
  const cmd = new DeleteObjectCommand({ Bucket: bucketName, Key: key });
  await s3Client.send(cmd);
}

export async function getObject(key: string) {
  if (!bucketName) throw new Error('S3_BUCKET no configurado');
  const cmd = new GetObjectCommand({ Bucket: bucketName, Key: key });
  const res = await s3Client.send(cmd);
  return res;
}

export async function uploadBuffer(key: string, buffer: Buffer, contentType: string) {
  if (!bucketName) throw new Error('S3_BUCKET no configurado');
  const cmd = new PutObjectCommand({ 
    Bucket: bucketName, 
    Key: key, 
    Body: buffer, 
    ContentType: contentType 
  });
  await s3Client.send(cmd);
}

// --- 3. MIDDLEWARES DE MULTER ---

// A) Para AGENTES (El nuevo que creamos)
export const uploadMiddleware = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: bucketName,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      // Guarda en carpeta 'agents/' con nombre limpio
      const uniqueName = `agents/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// B) Para DOCUMENTOS (El antiguo que restauramos)
// Lo reconstruimos para que use s3Client pero mantenga la firma que espera tu controlador
export function createImageUpload(maxBytes = 5 * 1024 * 1024) {
  return multer({
    storage: multerS3({
      s3: s3Client,
      bucket: bucketName,
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: (req, file, cb) => cb(null, { originalName: file.originalname }),
      key: (req: any, file, cb) => {
        // Estructura antigua para documentos
        const userId = req.user?.id || req.user?.sub || 'anonymous';
        const ext = (file.originalname.split('.').pop() || '').toLowerCase();
        cb(null, `documents/${userId}/${Date.now()}.${ext}`);
      }
    }),
    limits: { fileSize: maxBytes },
    fileFilter: (req, file, cb) => {
      // Filtro básico de imágenes
      const isImage = file.mimetype.startsWith('image/');
      cb(null, isImage);
    }
  });
}