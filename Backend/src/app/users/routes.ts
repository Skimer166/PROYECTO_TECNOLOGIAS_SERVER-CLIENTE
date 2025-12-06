import { Router } from "express";
import { getUsers, getUserById, postUsers, updateUser, deleteUser, getFavoriteAgents, updateUserRole, addUserCredits } from "./controller";
import { authMiddleware, verifyAdmin, verifyToken } from "../middlewares/auth";
const router = Router();

/**
 * @swagger 
 * /users:
 *  get:
 *      tags: [USERS]
 *      description: Listar usuarios
 *      security:
 *        - BearerAuth: []
 *      responses:
 *          200:
 *              description: success
 *          401:
 *              description: missing token
 */
router.get('', verifyToken, getUsers) //cuando haya un get a esta ruta se manda a llamar el metodo getUsers

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [USERS]
 *     description: Obtener un usuario por ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: success
 *       401:
 *         description: unauthorized
 *       404:
 *         description: not found
 */
router.get('/:id', verifyToken, getUserById)

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [USERS]
 *     description: Crear un nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Juan Pérez
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juanperez@mail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 123456
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: 64fa0c3e8b5f7a1234567890
 *                 name:
 *                   type: string
 *                   example: Juan Pérez
 *                 email:
 *                   type: string
 *                   example: juanperez@mail.com
 *       400:
 *         description: Datos inválidos o incompletos
 *       500:
 *         description: Error interno del servidor
 */
// Crear usuario en /users (alias de /users/register)
router.post('', postUsers)
router.post('/register', postUsers)

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags: [USERS]
 *     description: Actualizar un usuario por ID
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
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       401:
 *         description: missing token
 */
router.put('/:id', verifyToken, updateUser)

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags: [USERS]
 *     description: Eliminar un usuario por ID (solo admin)
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
 *         description: Eliminado
 *       404:
 *         description: not found
 *       401:
 *         description: missing token
 */
router.delete('/:id', verifyToken, verifyAdmin, deleteUser)

/**
 * @swagger
 * /users/favorites:
 *   get:
 *     tags: [USERS]
 *     description: Obtener la lista de agentes favoritos del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de agentes favoritos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: 001
 *                   name:
 *                     type: string
 *                     example: Agente Smith
 *                   specialty:
 *                     type: string
 *                     example: Ventas
 *       401:
 *         description: Token inválido o no proporcionado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/favorites', verifyToken, getFavoriteAgents);

/**
 * @swagger
 * /users/{id}/role:
 *   put:
 *     tags: [USERS]
 *     description: Actualizar el rol de un usuario (admin requerido)
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
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: admin
 *     responses:
 *       200:
 *         description: Rol actualizado
 *       400:
 *         description: ID o rol inválido
 *       401:
 *         description: missing token
 *       403:
 *         description: admin required
 *       404:
 *         description: not found
 */
// PUT /users/:id/role - Admin: actualizar rol
router.put('/:id/role', verifyToken, verifyAdmin, updateUserRole)

// PUT /users/:id/credits - Admin: agregar créditos
router.put('/:id/credits', verifyToken, verifyAdmin, addUserCredits)


export default router;
