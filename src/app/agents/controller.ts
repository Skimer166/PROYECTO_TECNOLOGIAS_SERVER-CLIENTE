import { Request, Response } from "express"

export function getAllAgents(req: Request, res: Response){
    const agents = [
        { id: 1, name: "Agente especialista en Python", description: "Asistente de codigo." },
        { id: 2, name: "Agente especualista Cocinando", description: "Te ayudara en la cocina." }
    ];

    res.json({ agents });
}

export function getFavoriteAgents(req: Request, res: Response){
    // Ejemplo simple: lista de agentes marcados como favoritos (mock)
    const favorites = [
        { id: 2, name: "Agente especualista Cocinando", description: "Te ayudara en la cocina." }
    ];

    res.json({ agents: favorites });
}
