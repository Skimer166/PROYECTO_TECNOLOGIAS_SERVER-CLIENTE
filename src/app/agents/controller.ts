import { Request, Response } from "express"

export function getAllAgents(req: Request, res: Response){
    const agents = [
        { id: 1, name: "Agente especialista en Python", description: "Asistente de codigo." },
        { id: 2, name: "Agente especualista Cocinando", description: "Te ayudara en la cocina." }
    ];

    res.json({ agents });
}

export function searchAgent(req: Request, res: Response){
    const { search } = req.params;
    res.json([
        { id: 1, name: 'Agente especialista en Python', description: 'Asistente de código.' },
        { id: 2, name: 'Agente especialista en Grafos Con Python', description: 'Te ayudare con los grafos en Python.' }
    ]);
}