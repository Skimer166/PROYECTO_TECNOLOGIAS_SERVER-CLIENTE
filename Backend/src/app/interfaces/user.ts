export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: 'user' | 'admin';
  googleId?: string;
  provider: 'local' | 'google';
  avatar?: string;
}