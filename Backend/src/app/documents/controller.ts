import { Request, Response } from 'express';
import { createImageUpload } from '../storage/s3';
export const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const upload = createImageUpload(MAX_SIZE_BYTES);

const disabled = (res: Response) => res.status(501).json({ message: 'Módulo de archivos deshabilitado temporalmente' });
//POST /files/upload
export async function uploadFile(req: Request, res: Response) {
  return disabled(res);
}
//GET /files
export async function listMyFiles(req: Request, res: Response) {
  return disabled(res);
}
//GET /files/:id/download
//export async function downloadFile(req: Request, res: Response) {
  //return disabled(res);
//}
//DELETE /files/:id
export async function deleteFile(req: Request, res: Response) {
  return disabled(res);
}
//PUT /files/:id/share
//export async function shareFile(req: Request, res: Response) {
  //return disabled(res);
//}