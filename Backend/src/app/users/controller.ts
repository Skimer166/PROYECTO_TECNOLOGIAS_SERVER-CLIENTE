import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { UserModel } from "./model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail } from "../mailer/controller";

//GET/users-CRUD: Read (listar usuarios)
export async function getUsers(req: Request, res: Response) {
  try {
    const users = await UserModel.find({}, { name: 1, email: 1, role: 1, credits: 1 }).lean();
    return res.json({
      users: users.map((u) => ({id: String(u._id),name: u.name,email: u.email,role: (u as any).role || 'user',credits: (u as any).credits ?? 0,})),
    });
  } catch (err) {
    console.error("Error listando usuarios:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//POST/users-CRUD: Create (crear usuario)
export async function postUsers(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Rellena todos los campos" });

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Formato de correo inválido" });
    }
      
    const emailExists = await UserModel.findOne({ email }).lean();
    if (emailExists) {
      return res.status(409).json({ message: "Email ya registrado" });
    }

    const nameExists = await UserModel.findOne({ name }).lean();
    if (nameExists) {
      return res.status(409).json({ message: "Nombre de usuario ya registrado" });
    }

    const exists = await UserModel.findOne({ email }).lean();
    if (exists) return res.status(409).json({ message: "Email ya registrado" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ name, email, passwordHash });

    //Enviar correo de bienvenida 
    try {
      await sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.error("Error enviando correo de bienvenida:", emailError);
    }

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

    const user = await UserModel.findById(id, { name: 1, email: 1, avatar: 1 }).lean();
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    return res.json({ id: String(user._id), name: user.name, email: user.email, avatar: user.avatar });
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

    const { name, email, password, avatar } = req.body || {};
    
    if (!name && !email && !password && !avatar) {
      return res.status(400).json({ message: "Nada para actualizar" });
    }

    if (email) {
      const exists = await UserModel.findOne({ email, _id: { $ne: id } }).lean();
      if (exists) return res.status(409).json({ message: "Email ya registrado" });
    }

    const update: any = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (avatar) update.avatar = avatar; 
    if (password) {
      update.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await UserModel.findByIdAndUpdate(
      id, 
      update, 
      { new: true, projection: { name: 1, email: 1, role: 1, avatar: 1 } }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Usuario no encontrado" });

    const token = jwt.sign(
      {
        sub: String(updated._id),
        email: updated.email,
        name: updated.name,
        role: updated.role || 'user',
        avatar: updated.avatar,
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    // devolvemos el usuario Y el nuevo token
    return res.json({ 
      user: { id: String(updated._id), name: updated.name, email: updated.email, avatar: updated.avatar },
      token: token 
    });

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
const JWT_SECRET = process.env.SECRET_KEY ?? process.env.JWT_KEY ?? 'dev-secret';
export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        message: 'Esta cuenta fue creada con Google. Inicia sesión usando "Iniciar sesión con Google".',
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);

    if (!ok) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

const token = jwt.sign(
      {
        sub: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        avatar: user.avatar,
        credits: user.credits
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Error en loginUser:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

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

// PUT /users/:id/credits - Admin: agregar créditos a un usuario
export async function addUserCredits(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const { amount } = req.body || {};
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Cantidad de créditos inválida' });
    }

    const user = await UserModel.findById(id).exec();
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.credits = (user.credits ?? 0) + numericAmount;
    await user.save();

    return res.json({
      id: String(user._id),
      credits: user.credits,
    });
  } catch (err) {
    console.error('Error agregando créditos:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

