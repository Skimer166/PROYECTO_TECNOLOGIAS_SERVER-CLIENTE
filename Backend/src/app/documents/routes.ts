import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { upload, uploadFile, listMyFiles, downloadFile, deleteFile, shareFile } from './controller';


const router = Router();

/**
 * @swagger
 * /files:
 *   get:
 *     tags: [FILES]
 *     description: Lista archivos del usuario autenticado
 *     responses:
 *       200:
 *         description: success
 *       401:
 *         description: unauthorized
 */
router.get('', authMiddleware, listMyFiles);

/**
 * @swagger
 * /files/upload:
 *   post:
 *     tags: [FILES]
 *     description: Subir imagen a S3 (máx 5MB, jpeg/png/webp)
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
router.post('/upload', authMiddleware, upload.single('file'), uploadFile);

/**
 * @swagger
 * /files/{id}/download:
 *   get:
 *     tags: [FILES]
 *     description: Descarga/stream del archivo (descarga vía servidor)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: success
 *       401:
 *         description: unauthorized
 *       403:
 *         description: forbidden
 *       404:
 *         description: not found
 */
router.get('/:id/download', authMiddleware, downloadFile);

/**
 * @swagger
 * /files/{id}:
 *   delete:
 *     tags: [FILES]
 *     description: Eliminar archivo del usuario (dueño)
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
router.delete('/:id', authMiddleware, deleteFile);

/**
 * @swagger
 * /files/{id}/share:
 *   put:
 *     tags: [FILES]
 *     description: Compartir/unshare archivo o hacerlo público (solo dueño)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               public:
 *                 type: boolean
 *                 description: Si true, el archivo se vuelve público
 *               userId:
 *                 type: string
 *                 description: ID de usuario con quien compartir
 *               action:
 *                 type: string
 *                 enum: [add, remove]
 *                 description: Agregar o quitar de la lista de compartidos
 *     responses:
 *       200:
 *         description: Actualización de compartición realizada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: unauthorized
 *       403:
 *         description: Solo dueño
 *       404:
 *         description: not found
 */
router.put('/:id/share', authMiddleware, shareFile);

export default router;
