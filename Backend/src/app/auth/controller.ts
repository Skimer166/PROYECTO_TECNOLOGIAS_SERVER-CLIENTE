import {Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../users/model";

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Rellena todos los campos" });
    }

    const user = await UserModel.findOne({ email }).lean();
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { sub: String(user._id), email: user.email, name: user.name },
      process.env.SECRET_KEY as string,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ token: `Bearer ${token}` });
  } catch (err: any) {
    console.error("Error en login:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
}

export function signup(req: Request, res: Response) {
    console.log('Signup body', req.body);
    return res.status(501).json({ message: "No implementado. Usa /users/register" });
}