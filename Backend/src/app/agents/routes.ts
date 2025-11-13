import { Router } from 'express';
import {
  getAllAgents,
  searchAgent,
  // getCategories,
  createAgent,
  getAgentById,
  updateAgent,
  deleteAgent
} from './controller';
import { verifyToken, verifyAdmin } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

 /**
  * @swagger
  * /agents:
  *   get:
  *     tags: [AGENTS]
  *     description: Listar agentes disponibles
  *     security:
  *       - BearerAuth: []
  *     parameters:
  *       - in: query
  *         name: available
  *         schema:
  *           type: boolean
  *         required: false
  *         description: true para solo disponibles
  *     responses:
  *       200:
  *         description: success
  *       401:
  *         description: missing token
  */
router.get('', verifyToken, getAllAgents);

/**
 * @swagger
 * /agents:
 *   post:
 *     tags: [AGENTS]
 *     description: Crear un nuevo agente (solo admin)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [marketing, salud, educacion, asistente, otros]
 *               language:
 *                 type: string
 *               modelVersion:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               pricePerHour:
 *                 type: number
 *     responses:
 *       201:
 *         description: Agente creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Solo administradores
 */
router.post('', verifyToken, verifyAdmin, createAgent);

/**
 * @swagger
 * /agents/{id}:
 *   get:
 *     tags: [AGENTS]
 *     description: Obtener detalle de un agente
 *     security:
 *       - BearerAuth: []
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
 *         description: No autorizado
 *       404:
 *         description: Agente no encontrado
 */
router.get('/:id', verifyToken, getAgentById);

/**
 * @swagger
 * /agents/{id}:
 *   put:
 *     tags: [AGENTS]
 *     description: Actualizar un agente
 *     security:
 *       - BearerAuth: []
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
 *     responses:
 *       200:
 *         description: Agente actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permiso
 *       404:
 *         description: Agente no encontrado
 */
router.put('/:id', verifyToken, verifyAdmin, updateAgent);

/**
 * @swagger
 * /agents/{id}:
 *   delete:
 *     tags: [AGENTS]
 *     description: Eliminar un agente
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agente eliminado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permiso
 *       404:
 *         description: Agente no encontrado
 */
router.delete('/:id', verifyToken, verifyAdmin, deleteAgent);

/**
 * @swagger
 * /agents/search:
 *   get:
 *     tags: [AGENTS]
 *     description: Buscar agentes por nombre o descripción.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Texto a buscar (por ejemplo, "python").
 *     responses:
 *       200:
 *         description: Lista de agentes coincidentes
 */
router.get('/search', searchAgent);

// /**
//  * @swagger
//  * /agents/categories:
//  *   get:
//  *     tags: [AGENTS]
//  *     description: categorias de agentes
//  *     responses:
//  *       200:
//  *         description: success
//  */
// router.get('/categories', getCategories);

export default router;