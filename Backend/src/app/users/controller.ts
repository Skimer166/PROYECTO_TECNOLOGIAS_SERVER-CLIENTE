import { Request, Response } from "express";
import { UserModel } from "./model";
import bcrypt from "bcryptjs";

export function getUsers(req: Request, res: Response) {
  console.log('Usuario autenticado correctamente');
  const user = { id: 123, name: "Juan Perez" };
  return res.json({ message: `Bienvenido ${user.name}`, user });
}

export async function postUsers(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Rellena todos los campos" });

    const exists = await UserModel.findOne({ email }).lean();
    if (exists) return res.status(409).json({ message: "Email ya registrado" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ name, email, passwordHash });

    return res.status(201).json({
      message: "Usuario creado correctamente",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err: any) {
    console.error("Error creando usuario:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
}

// GET /users/:id
export function getUserById(req: Request, res: Response) {
  const { id } = req.params;
  const user = { id, name: 'Juan Perez', email: 'juanperez@gmail.com' };
  return res.json(user);
}

export function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { name, email } = req.body || {};
  return res.json({ id, name: name ?? 'Juan Perez', email: email ?? 'juanperez@gmail.com' });
}

export function deleteUser(req: Request, res: Response) {
  return res.status(204).send();
}

export function getFavoriteAgents(req: Request, res: Response){
  const favorites = [
    { id: 2, name: "Agente especialista Cocinando", description: "Te ayudara en la cocina." }
  ];
  return res.json({ agents: favorites });
}