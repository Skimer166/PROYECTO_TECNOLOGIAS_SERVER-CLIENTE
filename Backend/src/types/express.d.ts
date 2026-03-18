declare namespace Express {
  interface User {
    id?: string;
    sub?: string;
    _id?: unknown;
    email?: string;
    name?: string;
    role?: 'user' | 'admin';
    status?: 'active' | 'blocked';
    credits?: number;
    avatar?: string;
  }
}
