import { Schema, model } from 'mongoose';

const agentSchema = new Schema(
  {
    name: { type: String, required: true, index: true }, 
    description: { type: String, required: true },      
    //atributo para decirle al agente como se debe comportar
    instructions: { type: String, required: true }, 
    category: { type: String, enum: ['marketing', 'salud', 'educacion', 'asistente', 'otros'], default: 'otros', index: true },
    language: { type: String, default: 'es' },          
    modelVersion: { type: String, required: true }, 
    imageUrl: { type: String },                   
    pricePerHour: { type: Number, required: true, min: 0 }, 
    
    // este campo controla si aparece en la Home activo o inactivo)
    availability: { type: Boolean, default: true }, 

    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      totalReviews: { type: Number, default: 0 }
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
  },
  { timestamps: true, collection: 'agents' }
);

export const AgentModel = model('Agent', agentSchema);