import { Schema, model, Document } from 'mongoose';
import { IUser } from '../interfaces/user';

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: function (this: any) {
        return !this.googleId;
      },
    },

    credits: { 
      type: Number, 
      default: 500, // se regalan 500 creditos al registrarse
      min: 0 
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },

    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
      index: true,
    },

    googleId: { type: String },

    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },

    avatar: { type: String },

    resetPasswordToken: { type: String },

    resetPasswordExpires: { type: Date },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

export const UserModel = model<IUser>('User', userSchema);
