import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import passport from './google';
import { loginUser } from '../users/controller';
import { UserModel } from '../users/model';
import bcrypt from 'bcryptjs';
import { sendPasswordResetEmail } from '../mailer/controller';

const JWT_KEY = process.env.JWT_KEY!;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

export async function login(req: Request, res: Response) {
  return loginUser(req, res);
}

export function signup(req: Request, res: Response) {
  console.log('Signup body', req.body);
  return res.status(501).json({ message: 'No implementado. Usa /users/register' });
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: 'Email requerido' });
    }

    const user = await UserModel.findOne({ email });

    // Para no filtrar si el correo existe o no, devolvemos siempre 200
    if (!user) {
      console.log('[forgotPassword] Solicitud para correo no registrado:', email);
      return res.status(200).json({
        message:
          'Si el correo está registrado, se enviará un enlace para restablecer la contraseña.',
      });
    }

    const token = jwt.sign(
      { sub: String(user._id), type: 'password-reset' },
      JWT_KEY,
      { expiresIn: '1h' },
    );

    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const frontendUrl = FRONTEND_URL || 'http://localhost:4200';
    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    try {
      await sendPasswordResetEmail(user.email, user.name, resetLink);
    } catch (mailError) {
      console.error('Error enviando correo de recuperación:', mailError);
    }

    return res.status(200).json({
      message:
        'Si el correo está registrado, se enviará un enlace para restablecer la contraseña.',
    });
  } catch (err) {
    console.error('Error en forgotPassword:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body || {};

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token y nueva contraseña requeridos' });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_KEY) as any;
    } catch (err) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    if (payload.type !== 'password-reset' || !payload.sub) {
      return res.status(400).json({ message: 'Token inválido' });
    }

    const user = await UserModel.findOne({
      _id: payload.sub,
      resetPasswordToken: token,
    });

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error en resetPassword:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

//redirige a google para que inicie sesion
export const googleAuthController = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const mode = (req.query.mode as string) === 'register' ? 'register' : 'login';

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state: mode,
  })(req, res, next);
};

//callback que recibe google despues de iniciar sesion
export const googleCallbackController = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    'google',
    { session: false },
    async (err: any, googleUser: any, info?: any) => {
      if (err || !googleUser) {
        console.error('Error en Google Auth:', err);
        return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
      }

      try {
        const mode = (req.query.state as string) === 'register' ? 'register' : 'login';
        const isNewUser = info && (info as any).isNewUser;

        // Si viene desde "Registrarse con Google" y el usuario YA existía,
        // redirigimos al REGISTRO con error de email en uso.
        if (mode === 'register' && !isNewUser) {
          return res.redirect(`${FRONTEND_URL}/register?error=email_already_used`);
        }

        const user = googleUser;

        const token = jwt.sign(
          {
            sub: user._id,
            email: user.email,
            role: user.role || 'user',
            avatar: user.avatar,
            name: user.name,
            credits: user.credits
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
