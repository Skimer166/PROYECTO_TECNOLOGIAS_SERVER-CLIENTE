import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import dotenv from 'dotenv';

dotenv.config();

// --- 1. CONFIGURACIÓN BASE ---
export const bucketName = process.env.S3_BUCKET || '';
const region = process.env.S3_REGION;
const accessKeyId = process.env.S3_ACCESS_KEY;
// Recuperamos el fallback por si en Render la llamaste SE_SECRET_KEY
const secretAccessKey = process.env.S3_SECRET_KEY || process.env.SE_SECRET_KEY; 

// --- DIAGNÓSTICO DE ARRANQUE ---
if (!accessKeyId || !secretAccessKey || !bucketName || !region) {
  console.error('\n❌ [ERROR CRÍTICO S3] Faltan variables de entorno:');
  console.error(` - S3_REGION: ${region}`);
  console.error(` - S3_ACCESS_KEY: ${accessKeyId ? 'OK' : 'FALTA'}`);
  console.error(` - S3_SECRET_KEY: ${secretAccessKey ? 'OK' : 'FALTA'}`);
  console.error(` - S3_BUCKET: ${bucketName ? 'OK' : 'FALTA'}\n`);
}

export const s3Client = new S3Client({
  region: region || 'us-east-1', // Default para evitar crash inmediato
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || ''
  }
});

// Alias para compatibilidad
export const s3 = s3Client; 

// --- 2. FUNCIONES HELPERS ---

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

// A) Para AGENTES
export const uploadMiddleware = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: bucketName,
    // acl: 'public-read', // Descomenta si tu bucket lo requiere explícitamente
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueName = `agents/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// B) Para DOCUMENTOS
export function createImageUpload(maxBytes = 5 * 1024 * 1024) {
  return multer({
    storage: multerS3({
      s3: s3Client,
      bucket: bucketName,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: (req, file, cb) => cb(null, { originalName: file.originalname }),
      key: (req: any, file, cb) => {
        const userId = req.user?.id || req.user?.sub || 'anonymous';
        const ext = (file.originalname.split('.').pop() || '').toLowerCase();
        cb(null, `documents/${userId}/${Date.now()}.${ext}`);
      }
    }),
    limits: { fileSize: maxBytes },
    fileFilter: (req, file, cb) => {
      const isImage = file.mimetype.startsWith('image/');
      cb(null, isImage);
    }
  });
}