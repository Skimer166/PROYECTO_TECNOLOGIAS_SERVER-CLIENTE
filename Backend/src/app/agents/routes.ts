import { Router } from "express";
import { getAllAgents, searchAgent, getCategories } from "./controller";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * /agents:
 *   get:
 *     tags: [AGENTS]
 *     description: Listar agentes disponibles
 *     parameters:
 *       - in: query
 *         name: token
 *         description: auth user token
 *         schema:
 *           type: string
 *           example: Bearer1234
 *     responses:
 *       200:
 *         description: success
 *       401:
 *         description: missing token
 */
router.get('', authMiddleware, getAllAgents);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Agente especialista en Python
 *                   description:
 *                     type: string
 *                     example: Asistente de código.
 */
router.get('/search', searchAgent);

/**
 * @swagger
 * /agents/categories:
 *   get:
 *     tags: [AGENTS]
 *     description: categorias de agentes
 *     parameters:
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         required: false
 *         description: Categoria a buscar (por ejemplo, "cocina").
 *     responses:
 *       200:
 *         description: success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       key:
 *                         type: string
 *                         example: programacion
 *                       name:
 *                         type: string
 *                         example: Programacion
 *                       description:
 *                         type: string
 *                         example: Agentes para codigo y scripts.
 *                       example:
 *                         type: string
 *                         example: Agente especialista en Python
 */
router.get('/categories', getCategories)


export default router;
