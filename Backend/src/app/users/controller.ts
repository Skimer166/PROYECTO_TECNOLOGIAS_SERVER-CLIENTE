import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { UserModel } from "./model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

//GET/users-CRUD: Read (listar usuarios)
export async function getUsers(req: Request, res: Response) {
  try {
    const users = await UserModel.find({}, { name: 1, email: 1 }).lean();
    return res.json({ users: users.map(u => ({ id: String(u._id), name: u.name, email: u.email })) });
  } catch (err) {
    console.error("Error listando usuarios:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
}

//POST/users-CRUD: Create (crear usuario)
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
      user: { id: String(user._id), name: user.name, email: user.email },
    });
  } catch (err: any) {
    console.error("Error creando usuario:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
}

//GET/users/:id-CRUD: Read (obtener usuario por id)
export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "ID inválido" });

    const user = await UserModel.findById(id, { name: 1, email: 1 }).lean();
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    return res.json({ id: String(user._id), name: user.name, email: user.email });
  } catch (err) {
    console.error("Error obteniendo usuario:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
}

//PUT/users/:id-CRUD: Update (actualizar usuario)
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "ID inválido" });

    const { name, email, password } = req.body || {};
    if (!name && !email && !password) {
      return res.status(400).json({ message: "Nada para actualizar" });
    }

    if (email) {
      const exists = await UserModel.findOne({ email, _id: { $ne: id } }).lean();
      if (exists) return res.status(409).json({ message: "Email ya registrado" });
    }

    const update: any = {};
    if (typeof name === 'string') update.name = name;
    if (typeof email === 'string') update.email = email;
    if (typeof password === 'string' && password.length > 0) {
      update.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await UserModel.findByIdAndUpdate(id, update, { new: true, projection: { name: 1, email: 1 } }).lean();
    if (!updated) return res.status(404).json({ message: "Usuario no encontrado" });

    return res.json({ id: String(updated._id), name: updated.name, email: updated.email });
  } catch (err) {
    console.error("Error actualizando usuario:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
}

//DELETE/users/:id-CRUD: Delete (eliminar usuario)
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "ID inválido" });

    const result = await UserModel.findByIdAndDelete(id).lean();
    if (!result) return res.status(404).json({ message: "Usuario no encontrado" });

    return res.status(204).send();
  } catch (err) {
    console.error("Error eliminando usuario:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
}

//GET /users/favorites falta el crud aca ruben el del modulo de agents
export function getFavoriteAgents(req: Request, res: Response){
  const favorites = [
    { id: 2, name: "Agente especialista Cocinando", description: "Te ayudara en la cocina." }
  ];
  return res.json({ agents: favorites });
}
//login
export const loginUser = async (req:Request, res:Response) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Faltan email o password' });
    }

    //importante: seleccionar el password si en el schema está con select:false
    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    //comparar texto plano vs hash guardado
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '2h' }
    );

    // Opcional: no devolver password nunca
    return res.json({ token });
  } catch (e) {
    console.error('loginUser error:', e);
    return res.status(500).json({ message: 'Error interno' });
  }
};

// PUT /users/:id/role - Admin: actualizar rol de usuario
export async function updateUserRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "ID inválido" });

    const { role } = req.body || {};
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Rol inválido. Usa 'user' o 'admin'" });
    }

    const updated = await UserModel.findByIdAndUpdate(
      id,
      { role },
      { new: true, projection: { name: 1, email: 1, role: 1 } }
    ).lean();
    if (!updated) return res.status(404).json({ message: "Usuario no encontrado" });

    return res.json({ id: String(updated._id), name: updated.name, email: updated.email, role: updated.role });
  } catch (err) {
    console.error("Error actualizando rol:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
}

