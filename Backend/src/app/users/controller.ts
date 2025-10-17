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

}

//http://localhost:3001/users/123?token=Bearer1234
export function getUserById(req: Request, res: Response) { //obtiene un usuario por su id
    const { id } = req.params;
    const name = "Juan Perez"
    res.send(`Consultando usuario: ${name}`);
    res.json({ id, name: 'Juan Perez', email: 'juanperez@gmail.com' });
  return 
}

export function updateUser(req: Request, res: Response) { //actualiza un usuario por su id
  const { id } = req.params;
  const { name, email } = req.body || {}; 
  return res.json({ id, name: name ?? 'Juan Perez', email: email ?? 'juanperez@gmail.com' });
}

export function deleteUser(req: Request, res: Response) {
  return res.status(204).send();
}

export function getFavoriteAgents(req: Request, res: Response){
    // Ejemplo simple: lista de agentes marcados como favoritos
    const favorites = [
        { id: 2, name: "Agente especialista Cocinando", description: "Te ayudara en la cocina." }
    ];

    res.json({ agents: favorites });
}