
import multer from 'multer';
export const bucketName = 'S3_DISABLED';
export async function uploadBuffer(key: string, buffer: Buffer, contentType: string) {
  return;
}
export async function deleteObject(key: string) {

  return;
}
export async function objectExists(key: string) {

  return false;
}
export async function getObject(key: string) {
  return null as any;
}
export const imageFileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  const flag = !!file.mimetype && file.mimetype.startsWith('image/');
  cb(null, flag);
};

const memoryStorage = multer.memoryStorage();
export function createImageUpload(maxBytes = 5 * 1024 * 1024) {
  return multer({ storage: memoryStorage, fileFilter: imageFileFilter, limits: { fileSize: maxBytes } });
}
/*
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
const region = process.env.S3_REGION;
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY ?? process.env.SE_SECRET_KEY;
export const bucketName = process.env.S3_BUCKET as string;
if (!region || !accessKeyId || !secretAccessKey) {
  console.warn('S3 config incompleta: define S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY');
}
export const s3 = new S3Client({
  region,
  credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
});
export async function uploadBuffer(key: string, buffer: Buffer, contentType: string) {
  if (!bucketName) throw new Error('S3_BUCKET no configurado');
  const cmd = new PutObjectCommand({ Bucket: bucketName, Key: key, Body: buffer, ContentType: contentType });
  await s3.send(cmd);
}
export async function deleteObject(key: string) {
  if (!bucketName) throw new Error('S3_BUCKET no configurado');
  const cmd = new DeleteObjectCommand({ Bucket: bucketName, Key: key });
  await s3.send(cmd);
}
export async function objectExists(key: string) {
  if (!bucketName) throw new Error('S3_BUCKET no configurado');
  try {
    const cmd = new HeadObjectCommand({ Bucket: bucketName, Key: key });
    await s3.send(cmd);
    return true;
  } catch {
    return false;
  }
}
export async function getObject(key: string) {
  if (!bucketName) throw new Error('S3_BUCKET no configurado');
  const cmd = new GetObjectCommand({ Bucket: bucketName, Key: key });
  const res = await (s3 as any).send(cmd);
  return res as { Body: any; ContentType?: string; ContentLength?: number; ETag?: string };
}
export const imageFileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  const flag = !!file.mimetype && file.mimetype.startsWith('image/');
  cb(null, flag);
};
export const s3Storage = multerS3({
  s3,
  bucket: bucketName,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (req, file, cb) => cb(null, { originalName: file.originalname }),
  acl: (req: any, file, cb) => {
    const isPublic = req?.body?.public === 'true' || req?.body?.public === true;
    cb(null, isPublic ? 'public-read' : 'private');
  },
  key: (req: any, file, cb) => {
    const userId = req?.user?.id || req?.user?.sub || 'anonymous';
    const ext = (file.originalname.split('.').pop() || '').toLowerCase();
    const name = Date.now();
    cb(null, `${userId}/${name}.${ext}`);
  }
});
export function createImageUpload(maxBytes = 5 * 1024 * 1024) {
  return multer({ storage: s3Storage, fileFilter: imageFileFilter, limits: { fileSize: maxBytes } });
}
*/