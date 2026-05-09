import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserModel } from '../../../app/users/model';

const JWT_SECRET = process.env.SECRET_KEY ?? process.env.JWT_KEY ?? 'dev-secret';

export function signToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
}

export async function createUser(overrides: {
  name?: string;
  email?: string;
  password?: string;
  role?: 'user' | 'admin';
  credits?: number;
  status?: 'active' | 'blocked';
} = {}) {
  const passwordHash = await bcrypt.hash(overrides.password ?? 'password123', 10);
  const user = await UserModel.create({
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? 'test@example.com',
    passwordHash,
    role: overrides.role ?? 'user',
    credits: overrides.credits ?? 0,
    status: overrides.status ?? 'active',
  });
  return user;
}

export function authHeader(user: { _id: unknown; email: string; name: string; role?: string }) {
  const token = signToken({
    sub: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role ?? 'user',
  });
  return { Authorization: `Bearer ${token}` };
}
