import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: 'user' | 'admin';
  googleId?: string;
  provider: 'local' | 'google';
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    //requerido solo si NO hay googleId 
    passwordHash: {
      type: String,
      required: function (this: any) {
        return !this.googleId; 
      },
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },

    googleId: { type: String },

    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

export const UserModel = model<IUser>('User', userSchema);
