import { Schema, model } from 'mongoose';

const agentSchema = new Schema(
  {
    name: { type: String, required: true, index: true }, 
    description: { type: String, required: true },      
    
    // el rol para OpenAI
    instructions: { type: String, required: true }, 

    category: { 
      type: String, 
      enum: ['marketing', 'salud', 'educacion', 'asistente', 'otros'], 
      default: 'otros', 
      index: true 
    },
    
    language: { type: String, default: 'es' },          
    modelVersion: { type: String, required: true }, 
    imageUrl: { type: String },                   
    pricePerHour: { type: Number, required: true, min: 0 }, 
    availability: { type: Boolean, default: true }, 
    
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      totalReviews: { type: Number, default: 0 }
    },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
    rentedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    usageStats: {
      totalSessions: { type: Number, default: 0 },
      totalMinutes: { type: Number, default: 0 }
    }
  },
  { timestamps: true, collection: 'agents' }
);

export const AgentModel = model('Agent', agentSchema);