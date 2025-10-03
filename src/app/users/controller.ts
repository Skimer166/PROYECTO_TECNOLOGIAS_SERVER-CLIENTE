import { Request, Response } from "express";

export function getUsers(req: Request, res: Response) {
    console.log('User:', req.user);
    const user = req.user as { id: number; name: string };
    res.send(`Bienvenido ${user.name}`);
}

export function postUsers(req: Request, res: Response) {
    const { name, email, password } = req.body;  

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Rellena todos los campos" });
    }

    res.send(`Usuario creado: ${name}`);
}