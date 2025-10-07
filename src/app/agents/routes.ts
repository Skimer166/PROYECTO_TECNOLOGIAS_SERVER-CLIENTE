import { Router } from "express";
import { getAllAgents, searchAgent } from "./controller";
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

export default router;
