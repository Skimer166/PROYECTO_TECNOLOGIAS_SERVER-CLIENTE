import { Request, Response } from 'express';
import { AgentModel } from './model'; 

//extraer el userId desde req.user
function getAuthUser(req: Request): { id?: string; role?: string } {
  const user = (req as any).user;
  if (!user) return {};
  return {
    id: user.id || user._id || user.userId,
    role: user.role
  };
}

//listar los agentes
export async function getAllAgents(req: Request, res: Response) {
  try {
    const { category, available } = req.query as {
      category?: string;
      available?: string;
    };

    const filter: any = {};

    if (category) {
      filter.category = category;
    }

    if (available !== undefined) {
      filter.availability = available === 'true';
    }

    const agents = await AgentModel.find(filter).lean().exec();
    res.json({ agents });
  } catch (err) {
    console.error('Error al listar agentes:', err);
    res.status(500).json({ message: 'Error al obtener agentes' });
  }
}

//obtener un agente por su ID
export async function getAgentById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const agent = await AgentModel.findById(id).lean().exec();
    if (!agent) {
      return res.status(404).json({ message: 'Agente no encontrado' });
    }

    res.json(agent);
  } catch (err) {
    console.error('Error al obtener agente:', err);
    res.status(500).json({ message: 'Error al obtener el agente' });
  }
}

//Crear un agente | solo si es rol = admin
export async function createAgent(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);

    if (!authUser.id) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    if (authUser.role !== 'admin') {
      return res.status(403).json({ message: 'Solo los administradores pueden crear agentes' });
    }

    const {
      name,
      description,
      category,
      language,
      modelVersion,
      imageUrl,
      pricePerHour
    } = req.body;

    const agent = new AgentModel({
      name,
      description,
      category,
      language,
      modelVersion,
      imageUrl,
      pricePerHour,
      createdBy: authUser.id
    });

    const saved = await agent.save();
    res.status(201).json(saved);

  } catch (err: any) {
    console.error('Error al crear agente:', err);

    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Datos inválidos', error: err.message });
    }

    res.status(500).json({ message: 'Error al crear el agente' });
  }
}

//Actualizar un agente
export async function updateAgent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const authUser = getAuthUser(req);
    if (!authUser.id) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const agent = await AgentModel.findById(id).exec();
    if (!agent) {
      return res.status(404).json({ message: 'Agente no encontrado' });
    }

    const isOwner = agent.createdBy.toString() === authUser.id;
    const isAdmin = authUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'No tienes permiso para modificar este agente' });
    }

    const {
      name,
      description,
      category,
      language,
      modelVersion,
      imageUrl,
      pricePerHour,
      availability
    } = req.body;

    if (name !== undefined) agent.name = name;
    if (description !== undefined) agent.description = description;
    if (category !== undefined) agent.category = category;
    if (language !== undefined) agent.language = language;
    if (modelVersion !== undefined) agent.modelVersion = modelVersion;
    if (imageUrl !== undefined) agent.imageUrl = imageUrl;
    if (pricePerHour !== undefined) agent.pricePerHour = pricePerHour;
    if (availability !== undefined) agent.availability = availability;

    const updated = await agent.save();
    res.json(updated);
  } catch (err: any) {
    console.error('Error al actualizar agente:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Datos inválidos', error: err.message });
    }
    res.status(500).json({ message: 'Error al actualizar el agente' });
  }
}

//Eliminar un agente | Solo rol admin
export async function deleteAgent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const authUser = getAuthUser(req);
    if (!authUser.id) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const agent = await AgentModel.findById(id).exec();
    if (!agent) {
      return res.status(404).json({ message: 'Agente no encontrado' });
    }

    const isOwner = agent.createdBy.toString() === authUser.id;
    const isAdmin = authUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este agente' });
    }

    await agent.deleteOne();
    res.json({ message: 'Agente eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar agente:', err);
    res.status(500).json({ message: 'Error al eliminar el agente' });
  }
}

//Buscar agentes por nombre o descripcion
export async function searchAgent(req: Request, res: Response) {
  try {
    const { search } = req.query as { search?: string };

    if (!search) {
      const agents = await AgentModel.find().lean().exec();
      return res.json({ agents });
    }

    const regex = new RegExp(search, 'i'); 
    const agents = await AgentModel.find({
      $or: [{ name: regex }, { description: regex }]
    })
      .lean()
      .exec();

    res.json({ agents });
  } catch (err) {
    console.error('Error al buscar agentes:', err);
    res.status(500).json({ message: 'Error al buscar agentes' });
  }
}

// /**
//  * GET /agents/categories
//  * De momento hardcodeado (podrías mapear desde el enum del schema si quisieras).
//  */
// export function getCategories(req: Request, res: Response) {
//   const categories = [
//     { id: 1, key: 'marketing', name: 'Marketing', description: 'Agentes para campañas, anuncios y redes sociales.', example: 'Agente de copies para anuncios' },
//     { id: 2, key: 'salud', name: 'Salud', description: 'Agentes para hábitos saludables y bienestar (no médicos).', example: 'Coach de hábitos saludables' },
//     { id: 3, key: 'educacion', name: 'Educación', description: 'Agentes para aprendizaje y tutorías.', example: 'Tutor de matemáticas' },
//     { id: 4, key: 'asistente', name: 'Asistente', description: 'Asistentes generales para tareas diarias.', example: 'Asistente personal para productividad' },
//     { id: 5, key: 'otros', name: 'Otros', description: 'Agentes de categorías variadas.', example: 'Agente creativo para historias' }
//   ];

//   res.json({ categories });
// }