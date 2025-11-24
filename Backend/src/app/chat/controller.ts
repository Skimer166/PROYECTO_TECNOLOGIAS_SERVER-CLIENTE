import { Request, Response } from 'express';
import OpenAI from 'openai';
import { AgentModel } from '../agents/model';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function chatWithAgent(req: Request, res: Response) {
  try {
    const { agentId, message } = req.body;

    if (!agentId || !message) {
      return res.status(400).json({ message: 'Se requiere agentId y message' });
    }

    const agent = await AgentModel.findById(agentId).lean();

    if (!agent) {
      return res.status(404).json({ message: 'Agente no encontrado' });
    }

    if (!agent.availability) {
      return res.status(403).json({ message: 'Este agente no está disponible actualmente.' });
    }

    // llamar a OpenAI inyectando el "Rol" del agente
    const completion = await openai.chat.completions.create({
      model: agent.modelVersion, 
      messages: [
        { 
          role: "system", 
          content: agent.instructions // rol del agente
        },
        { 
          role: "user", 
          content: message 
        }
      ],
    });

    const botResponse = completion.choices[0].message.content;

    return res.json({ 
      agent: agent.name,
      response: botResponse,
      usage: completion.usage 
    });

  } catch (error: any) {
    console.error('Error en chat OpenAI:', error);
    return res.status(500).json({ message: 'Error al procesar el mensaje con la IA' });
  }
}