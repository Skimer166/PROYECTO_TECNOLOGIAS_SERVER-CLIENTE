import { Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: 'user' | 'admin';
  status?: 'active' | 'blocked';
  googleId?: string;
  provider: 'local' | 'google';
  avatar?: string;
  credits: number;
   resetPasswordToken?: string;
   resetPasswordExpires?: Date;
}
