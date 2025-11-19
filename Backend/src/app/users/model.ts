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

    avatar: { type: String }, 
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

export const UserModel = model<IUser>('User', userSchema);
