import { Router } from "express";
import {login, signup} from "./controller";

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [AUTH]
 *     description: Iniciar sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token generado
 */
router.post('/login', login);    //se pone solamente login porque creamos la funcion en otro archivo

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags: [AUTH]
 *     description: Registrar un nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado
 */
router.post('/signup', signup);

export default router;