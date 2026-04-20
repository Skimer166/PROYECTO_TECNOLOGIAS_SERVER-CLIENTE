import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import passport from './google';
import { loginUser } from '../users/controller';
import { UserModel } from '../users/model';
import bcrypt from 'bcryptjs';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../mailer/controller';

const JWT_KEY = process.env.JWT_KEY!;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const JWT_SECRET = process.env.SECRET_KEY ?? process.env.JWT_KEY ?? 'dev-secret';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        message: 'Esta cuenta fue creada con Google. Inicia sesión usando "Iniciar sesión con Google".',
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);

    if (!ok) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

const token = jwt.sign(
      {
        sub: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        avatar: user.avatar,
        credits: user.credits,
        status: user.status || 'active',
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Error en loginUser:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function signup(req: Request, res: Response) {
  try {
      const { name, email, password } = req.body;

      if (!name || !email || !password)
        return res.status(400).json({ message: "Rellena todos los campos" });

      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Formato de correo inválido" });
      }

      const emailExists = await UserModel.findOne({ email }).lean();
      if (emailExists) {
        return res.status(409).json({ message: "Email ya registrado" });
      }

      const nameExists = await UserModel.findOne({ name }).lean();
      if (nameExists) {
        return res.status(409).json({ message: "Nombre de usuario ya registrado" });
      }

      const exists = await UserModel.findOne({ email }).lean();
      if (exists) return res.status(409).json({ message: "Email ya registrado" });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await UserModel.create({ name, email, passwordHash });

      //Enviar correo de bienvenida
      try {
        await sendWelcomeEmail(email, name);
      } catch (emailError) {
        console.error("Error enviando correo de bienvenida:", emailError);
      }

      return res.status(201).json({
        message: "Usuario creado correctamente",
        user: { id: String(user._id), name: user.name, email: user.email },
      });
    } catch (err: unknown) {
      console.error("Error creando usuario:", err);
      return res.status(500).json({ message: "Error del servidor" });
    }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    console.log('1. [forgotPassword] Petición recibida.'); // <--- NUEVO LOG
    const { email } = req.body || {};
    console.log('2. [forgotPassword] Email recibido:', email); // <--- NUEVO LOG

    if (!email) {
      console.log('3. [forgotPassword] Falta el email.'); // <--- NUEVO LOG
      return res.status(400).json({ message: 'Email requerido' });
    }
    const token = req.body || {};
    const user = await UserModel.findOne({ email });

    if (!user) {
      console.log('4. [forgotPassword] Usuario no encontrado en BD:', email);
      // ... respuesta 200 ...
      return res.status(200).json({ message: '...' });
    }

    console.log('5. [forgotPassword] Usuario encontrado. Generando token...'); // <--- NUEVO LOG

    // ... código de generación de token ...

    const resetLink = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
    console.log('6. [forgotPassword] Intentando enviar correo a:', user.email); // <--- NUEVO LOG

    try {
      await sendPasswordResetEmail(user.email, user.name, resetLink);
      console.log('7. [forgotPassword] ¡Correo enviado con éxito!'); // <--- SI LLEGA AQUÍ, TODO FUNCIONÓ
    } catch (mailError) {
      console.error('X. [forgotPassword] Error al enviar el correo:', mailError); // <--- AQUÍ VERÁS EL ERROR DE TIMEOUT
    }

    return res.status(200).json({ message: '...' });

  } catch (err) {
    console.error('Z. [forgotPassword] Error CRÍTICO en el controlador:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body || {};

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token y nueva contraseña requeridos' });
    }

    interface ResetPayload {
      type?: string;
      sub?: string;
    }
    let payload: ResetPayload;
    try {
      payload = jwt.verify(token, JWT_KEY) as ResetPayload;
    } catch {
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
    async (err: Error | null, googleUser: Express.User | false | null, info?: { isNewUser?: boolean }) => {
      if (err || !googleUser) {
        console.error('Error en Google Auth:', err);
        return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
      }

      try {
        const mode = (req.query.state as string) === 'register' ? 'register' : 'login';
        const isNewUser = info && info.isNewUser;

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
