import { Request, Response } from "express";

export function getUsers(req: Request, res: Response) {
    console.log('Usuario autenticado correctamente');
    const user = { id: 123, name: "Juan Perez" };
    res.send(`Bienvenido ${user.name}`);
}

export function postUsers(req: Request, res: Response) {
    const { name, email, password } = req.body;  

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Rellena todos los campos" });
    }

    res.send(`Usuario creado: ${name}`);
}

export function getUserById(req: Request, res: Response) { //obtiene un usuario por su id
  const { id } = req.params;
  return res.json({ id, name: 'Usuario Dummy', email: 'dummy@correo.com' });
}

export function updateUser(req: Request, res: Response) { //actualiza un usuario por su id
  const { id } = req.params;
  const { name, email } = req.body || {}; 
  return res.json({ id, name: name ?? 'Usuario Dummy', email: email ?? 'dummy@correo.com' });
}

export function deleteUser(req: Request, res: Response) {
  return res.status(204).send();
}
