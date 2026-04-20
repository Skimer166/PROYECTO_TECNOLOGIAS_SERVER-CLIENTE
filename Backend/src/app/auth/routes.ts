import { Router } from "express";
import { googleAuthController, googleCallbackController, login, forgotPassword, resetPassword, signup } from "./controller";
import { sign } from "crypto";

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
 *       401:
 *         description: Credenciales inválidas
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

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [AUTH]
 *     description: Enviar correo de recuperación de contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Si el correo está registrado, se envía un enlace
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [AUTH]
 *     description: Establecer una nueva contraseña usando un token de recuperación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 *       400:
 *         description: Token inválido o expirado
 */
router.post('/reset-password', resetPassword);


//rutas para el login y signup con google
router.get('/google', googleAuthController);
router.get('/google/callback', googleCallbackController);

export default router;