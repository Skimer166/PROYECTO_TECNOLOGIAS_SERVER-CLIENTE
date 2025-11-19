import { Router } from 'express';
import { verifyToken } from '../middlewares/auth';
import { upload, uploadFile, listMyFiles, deleteFile } from './controller';


const router = Router();

/**
 * @swagger
 * /files:
 *   get:
 *     tags: [FILES]
 *     description: Lista archivos del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: success
 *       401:
 *         description: unauthorized
 */
router.get('', verifyToken, listMyFiles);

/**
 * @swagger
 * /files/upload:
 *   post:
 *     tags: [FILES]
 *     description: Subir imagen a S3 (máx 5MB, jpeg/png/webp)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     # Notas:
 *     # - En esta opción simplificada no se muestra el campo 'public'.
 *     # - El archivo se guarda como PRIVADO por defecto.

 *     responses:
 *       201:
 *         description: Archivo subido
 *       400:
 *         description: Validación fallida (tipo, tamaño o dimensiones)
 *       401:
 *         description: unauthorized
 *       500:
 *         description: Error del servidor
 */
router.post('/upload', verifyToken, upload.single('file'), uploadFile);



/**
 * @swagger
 * /files/{id}:
 *   delete:
 *     tags: [FILES]
 *     description: Eliminar archivo del usuario (dueño)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: deleted
 *       401:
 *         description: unauthorized
 *       403:
 *         description: forbidden
 *       404:
 *         description: not found
 */
router.delete('/:id', verifyToken, deleteFile);



export default router;
