import { Router } from "express";
import { getAllAgents, getFavoriteAgents } from "./controller";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * /agents:
 *   get:
 *     tags: [AGENTS]
 *     description: Listar agentes disponibles
 *     responses:
 *       200:
 *         description: success
 */
router.get('', getAllAgents);

/**
 * @swagger
 * /agents/favorites:
 *   get:
 *     tags: [AGENTS]
 *     description: Listar agentes marcados con like (favoritos)
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
router.get('/favorites', authMiddleware, getFavoriteAgents);

export default router;
