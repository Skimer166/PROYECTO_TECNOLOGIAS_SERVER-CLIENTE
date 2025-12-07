export interface User {
    id?: string;
    name: string;
    email: string;
    password?: string;
    image?: string; 
    credits?: number;
    role?: 'admin' | 'user'; 
}