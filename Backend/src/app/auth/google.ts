import passport from 'passport';
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from 'passport-google-oauth20';
import { UserModel } from '../users/model'; 

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn(
    '[Google Auth] Falta GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en .env. Google OAuth no funcionará correctamente.'
  );
}

function normalizeUtf8(str: string) {
  return Buffer.from(str, 'utf8').toString();
}


passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName || '';
        const avatar = profile.photos?.[0]?.value; 

        if (!email) {
          return done(new Error('No se recibió email desde Google'), undefined);
        }

        let user = await UserModel.findOne({ email });
        const cleanName = name ? normalizeUtf8(name) : 'Usuario Google';

        if (!user) {
          user = await UserModel.create({
            name: cleanName,
            email,
            googleId: profile.id,
            provider: 'google',
            avatar, 
          });
        } else {
            //actualizamos datos si cambia algo en el perfil del usuario
          let updated = false;
          

          if (!user.avatar && avatar) {
            user.avatar = avatar;
            updated = true;
          }
          if (!user.googleId) {
            user.googleId = profile.id;
            updated = true;
          }
          if (user.provider !== 'google') {
            user.provider = 'google';
            updated = true;
          }

          if (updated) await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err as any, undefined);
      }
    }
  )
);

export default passport;
