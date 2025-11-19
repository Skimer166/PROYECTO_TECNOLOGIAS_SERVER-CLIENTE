import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email:{ type: String, required: true, unique: true, index: true },

    passwordHash: { type: String, required: function() { 
      return !this.googleId; 
      } 
    },

    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    googleId: { type: String },
    provider: { type: String, default: 'local' },
  },
  
  { timestamps: true, collection: 'users' }
);

export const UserModel = model('User', userSchema);