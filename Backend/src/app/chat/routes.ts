import { Router } from 'express';
import { chatWithAgent } from './controller';
import { verifyToken } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /chat:
 * post:
 * tags: [CHAT]
 * description: Enviar un mensaje a un agente
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * agentId:
 * type: string
 * message:
 * type: string
 * responses:
 * 200:
 * description: Respuesta de la IA
 */
router.post('/', verifyToken, chatWithAgent);

export default router;