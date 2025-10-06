import { Router } from "express";
import { getAllAgents } from "./controller";
import { authMiddleware } from "../middlewares/auth";
const router = Router();

/**
 * @swagger
 * /agents:
 *   get:
 *     tags: [AGENTS]
 *     summary: Obtener todos los agentes
 *     description: Retorna la lista completa de agentes registrados. Se requiere un token válido como query param.
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           example: Bearer1234
 *         description: Token de autenticación requerido por el middleware.
 *     responses:
 *       200:
 *         description: Lista de agentes obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: number
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Agente Alfa
 *                   description:
 *                     type: string
 *                     example: Agente especializado en soporte técnico
 *       401:
 *         description: No autorizado (token inválido o ausente)
 *       404:
 *         description: No se encontraron agentes
 */
router.get('', authMiddleware, getAllAgents);

export default router;