import { Request, Response } from 'express';
import { AgentModel } from './model';
import { UserModel } from '../users/model';
import { io } from '../../index';

//extraer el userId desde req.user
function getAuthUser(req: Request): { id?: string; role?: string } {
  const user = (req as any).user;
  if (!user) return {};
  return {
    id: user.id,
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

//Crear un agente 
export const createAgent = async (req: Request, res: Response) => {
  try {
    const authUser = getAuthUser(req);

    if (!authUser.id) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    if (authUser.role !== 'admin') {
        return res.status(403).json({ message: 'Se requieren permisos de administrador' });
    }

    const { name, description, category, pricePerHour, language, modelVersion, instructions } = req.body;
    
    const imageUrl = (req.file as any)?.location || ''; 

    const newAgent = await AgentModel.create({
      name,
      description,
      category,
      pricePerHour: Number(pricePerHour),
      language,
      modelVersion,
      instructions,
      imageUrl,
      availability: true,
      createdBy: authUser.id 
    });

    res.status(201).json(newAgent);
  } catch (error) {
    console.error(error); 
    res.status(500).json({ message: 'Error creando agente' });
  }
};

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
      instructions, 
      category,
      language,
      modelVersion,
      imageUrl,
      pricePerHour,
      availability
    } = req.body;

    if (name !== undefined) agent.name = name;
    if (description !== undefined) agent.description = description;
    
    if (instructions !== undefined) agent.instructions = instructions; 
    
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

// Rentar un agente (Asignarlo al usuario)
export async function rentAgent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    // recibimos cantidad y unidad del body
    const { amount = 1, unit = 'hours' } = req.body; 

    const userToken = req.user as any;
    const userId = userToken?.id || userToken?.sub;

    if (!userId) return res.status(401).json({ message: 'No autorizado' });

    const user = await UserModel.findById(userId).exec();
    const agent = await AgentModel.findById(id).exec();

    if (!user || !agent) return res.status(404).json({ message: 'Usuario o Agente no encontrado' });

    if (agent.rentedBy && agent.rentedBy.toString() !== userId) {
       return res.status(400).json({ message: 'Agente ocupado' });
    }

    // calculamos costo
    let multiplier = 1;
    switch (unit) {
      case 'days': multiplier = 24; break;
      case 'months': multiplier = 24 * 30; break; // estandarizamos mes a 30 días
      default: multiplier = 1; 
    }

    const totalHours = amount * multiplier;
    const costo = agent.pricePerHour * totalHours;

    // verificar créditos
    if ((user.credits || 0) < costo) {
      return res.status(402).json({ message: `Créditos insuficientes. Necesitas ${costo}.` });
    }

    // cobrar créditos
    user.credits = (user.credits || 0) - costo;
    await user.save();

    // asignar tiempo
    const now = new Date();
    const expirationTime = new Date(now.getTime() + (totalHours * 60 * 60 * 1000)); 

    agent.rentedBy = userId;
    agent.rentedUntil = expirationTime;
    
    if (!agent.instructions) agent.instructions = "Asistente útil.";
    
    await agent.save();

    // noti cuando se termine el tiempo
    const msUntilEnd = expirationTime.getTime() - Date.now();
    if (msUntilEnd > 0) {
      setTimeout(async () => {
        try {
          const refreshed = await AgentModel.findById(agent._id).lean().exec();
          if (!refreshed) return;
          // si ya no esta rentado o se extendio el tiempo, lo notificamos
          if (!refreshed.rentedBy || !refreshed.rentedUntil) return;
          if (new Date(refreshed.rentedUntil).getTime() > Date.now()) return;

          io.to(String(userId)).emit('agent-time-ended', {
            agentId: String(refreshed._id),
            name: refreshed.name,
          });
        } catch (error) {
          console.error('Error enviando notificación de fin de tiempo:', error);
        }
      }, msUntilEnd);
    }

    res.json({ 
      message: `Renta exitosa por ${amount} ${unit}.`, 
      agent,
      remainingCredits: user.credits 
    });

  } catch (err) {
    console.error('Error rentando:', err);
    res.status(500).json({ message: 'Error al rentar' });
  }
}

// Listar los agentes que YO he rentado
export async function getMyRentedAgents(req: Request, res: Response) {
  try {
    const userId = (req.user as any).sub || (req.user as any).id;
    if (!userId) return res.status(401).json({ message: 'No autorizado' });

    const agents = await AgentModel.find({ rentedBy: userId }).lean().exec();
    res.json({ agents });
  } catch (err) {
    console.error('Error obteniendo mis agentes:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

// Liberar (devolver) un agente
export async function releaseAgent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req.user as any).sub || (req.user as any).id;

    const agent = await AgentModel.findById(id).exec();
    if (!agent) return res.status(404).json({ message: 'Agente no encontrado' });

    if (agent.rentedBy?.toString() !== userId) {
      return res.status(403).json({ message: 'No eres el dueño de este alquiler' });
    }

    agent.rentedBy = undefined; 
    await agent.save();

    res.json({ message: 'Agente liberado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al liberar agente' });
  }
}

