import { Document, Types } from 'mongoose';

export interface IAgent extends Document {
  name: string;
  description: string;
  instructions: string;
  category: 'marketing' | 'salud' | 'educacion' | 'asistente' | 'otros';
  language: string;
  modelVersion: string;
  imageUrl?: string;
  pricePerHour: number;
  availability: boolean;
  // relaciones
  createdBy: Types.ObjectId;
  rentedBy?: Types.ObjectId;
  rentedUntil?: Date; 
  ratings?: {
    average: number;
    totalReviews: number;
  };
  usageStats?: {
    totalSessions: number;
    totalMinutes: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}