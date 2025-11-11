import { Request, Response } from "express"


export function getAllAgents(req: Request, res: Response){
    const agents = [
        { id: 1, name: "Agente especialista en Python", description: "Asistente de codigo." },
        { id: 2, name: "Agente especualista Cocinando", description: "Te ayudara en la cocina." }
    ];
    res.json({ agents });
}

export function searchAgent(req: Request, res: Response){
    const { search } = req.query as { search?: string };
    res.json([
        { id: 1, name: 'Agente especialista en Python', description: 'Asistente de código.' },
        { id: 2, name: 'Agente especialista en Grafos Con Python', description: 'Te ayudare con los grafos en Python.' }
    ]);
}


export function getCategories(req: Request, res: Response){
    const { categories: categorias } = req.params
    const categories = [
      { id: 1, key: 'programacion', name: 'programacion', description: 'Agentes para codigo y scripts.', example: 'Agente especialista en Python' },
      { id: 2, key: 'datos', name: 'datos', description: 'Analisis de datos y BI.', example: 'Analista de datos con SQL y pandas' },
      { id: 3, key: 'cocina', name: 'ccocina', description: 'Recetas y tecnicas culinarias.', example: 'Chef virtual para recetas rapidas' },
      { id: 4, key: 'productividad', name: 'productividad', description: 'Organizacion, notas y tareas.', example: 'Planificador de tareas' }
    ]
    res.json({ categories })
}

