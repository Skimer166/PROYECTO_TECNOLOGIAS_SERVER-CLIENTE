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

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName || '';

        if (!email) {
          return done(new Error('No se recibió email desde Google'), undefined);
        }

        let user = await UserModel.findOne({ email });

        if (!user) {
          user = await UserModel.create({
            name: name || email.split('@')[0],
            email,
            googleId: profile.id,
            provider: 'google',
            // passwordHash NO es requerido cuando hay googleId
          });
        } else {
          if (!user.googleId) {
            user.googleId = profile.id;
          }
          if (!user.provider || user.provider === 'local') {
            user.provider = 'google';
          }
          await user.save();
        }

        return done(null, user as any);
      } catch (err) {
        return done(err as any, undefined);
      }
    }
  )
);

export default passport;
