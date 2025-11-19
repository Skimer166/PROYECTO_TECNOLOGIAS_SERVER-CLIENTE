// auth/controller.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import passport from './google';
import { loginUser } from '../users/controller';
// 👇 ajusta la ruta según tu proyecto
import {UserModel} from '../users/model'; 

const JWT_KEY = process.env.JWT_KEY!;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

export async function login(req: Request, res: Response) {
  return loginUser(req, res);
}

export function signup(req: Request, res: Response) {
  console.log('Signup body', req.body);
  return res.status(501).json({ message: 'No implementado. Usa /users/register' });
}


//redirige a google para que inicie sesion
export const googleAuthController = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

//callback que recibe google despues de iniciar sesion
export const googleCallbackController = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    'google',
    { session: false },
    async (err: any, googleUser: any) => {
      if (err || !googleUser) {
        console.error('Error en Google Auth:', err);
        return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
      }

      try {
        const { email, name, googleId } = googleUser;

        if (!email) {
          return res.redirect(`${FRONTEND_URL}/login?error=no_email_from_google`);
        }

        //buscar usuario por email
        let user = await UserModel.findOne({ email });

        // si no existe, crearlo
        if (!user) {
          user = await UserModel.create({
            name: name || 'Usuario Google',
            email,
            googleId,
            provider: 'google',
          });
        }

        // generar JWT 
        const token = jwt.sign(
          {
            id: user._id,
            email: user.email,
            role: user.role || 'user',
          },
          JWT_KEY,
          { expiresIn: '2h' }
        );

        //redirigir al front con el token
        const redirectUrl = `${FRONTEND_URL}/login/success?token=${token}`;
        return res.redirect(redirectUrl);
      } catch (e) {
        console.error('Error al procesar usuario de Google:', e);
        return res.redirect(`${FRONTEND_URL}/login?error=server_error`);
      }
    }
  )(req, res, next);
};