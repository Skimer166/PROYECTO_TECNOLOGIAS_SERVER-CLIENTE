import { Request, Response } from "express";
import { loginUser } from "../users/controller";

export async function login(req: Request, res: Response) {
  return loginUser(req, res);
}

export function signup(req: Request, res: Response) {
  console.log("Signup body", req.body);
  return res.status(501).json({ message: "No implementado. Usa /users/register" });
}