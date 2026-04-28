// Capturamos el callback de GoogleStrategy antes de que cargue el módulo
type GoogleDone = (err: Error | null, user?: unknown, info?: unknown) => void;
type GoogleCallback = (
  accessToken: string,
  refreshToken: string,
  profile: unknown,
  done: GoogleDone
) => Promise<void>;

let capturedCallback: GoogleCallback;

jest.mock('passport-google-oauth20', () => ({
  Strategy: jest.fn().mockImplementation(
    (_options: unknown, cb: GoogleCallback) => { capturedCallback = cb; }
  ),
}));

jest.mock('passport', () => ({ use: jest.fn() }));

jest.mock('../app/users/model', () => ({
  UserModel: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../app/mailer/controller', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
}));

// Variables de entorno antes de require para que la estrategia se registre
process.env.GOOGLE_CLIENT_ID = 'test-google-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-secret';

// Cargar el módulo para que se ejecute passport.use(new GoogleStrategy(...))
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('../app/auth/google');

import { UserModel } from '../app/users/model';
import { sendWelcomeEmail } from '../app/mailer/controller';

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'google-profile-id',
    displayName: 'Juan Google',
    emails: [{ value: 'juan@gmail.com' }],
    photos: [{ value: 'https://photo.url/avatar.jpg' }],
    ...overrides,
  };
}

describe('Google OAuth Strategy Callback Tests', () => {
  let doneMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    doneMock = jest.fn();
    // resetMocks borra las implementaciones; garantizamos que devuelve Promise para evitar .catch() sobre undefined
    (sendWelcomeEmail as jest.Mock).mockResolvedValue(undefined);
  });

  it('Debe estar definido el callback de la estrategia', () => {
    expect(capturedCallback).toBeDefined();
    expect(typeof capturedCallback).toBe('function');
  });

  it('Debe llamar a done(error) si el perfil no tiene email', async () => {
    const profile = makeProfile({ emails: [] });

    await capturedCallback('access', 'refresh', profile, doneMock);

    expect(doneMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'No se recibió email desde Google' }),
      undefined
    );
  });

  it('Debe llamar a done(error) si emails es undefined', async () => {
    const profile = makeProfile({ emails: undefined });

    await capturedCallback('access', 'refresh', profile, doneMock);

    expect(doneMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'No se recibió email desde Google' }),
      undefined
    );
  });

  it('Debe crear un usuario nuevo si no existe en BD y enviar email de bienvenida', async () => {
    const profile = makeProfile();
    const mockCreatedUser = {
      _id: 'newUserId',
      name: 'Juan Google',
      email: 'juan@gmail.com',
      googleId: 'google-profile-id',
    };

    (UserModel.findOne as jest.Mock).mockResolvedValue(null);
    (UserModel.create as jest.Mock).mockResolvedValue(mockCreatedUser);

    await capturedCallback('access', 'refresh', profile, doneMock);

    expect(UserModel.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'juan@gmail.com',
      googleId: 'google-profile-id',
      provider: 'google',
    }));
    expect(doneMock).toHaveBeenCalledWith(null, mockCreatedUser, { isNewUser: true });

    // Esperar a que el sendWelcomeEmail (fire-and-forget) se resuelva
    await new Promise(resolve => setImmediate(resolve));
    expect(sendWelcomeEmail).toHaveBeenCalledWith('juan@gmail.com', 'Juan Google');
  });

  it('Debe llamar done(null, user) sin hacer save si el usuario ya tiene todos los campos', async () => {
    const profile = makeProfile();
    const existingUser = {
      _id: 'existingUserId',
      email: 'juan@gmail.com',
      avatar: 'https://photo.url/avatar.jpg',
      googleId: 'google-profile-id',
      provider: 'google',
      save: jest.fn(),
    };

    (UserModel.findOne as jest.Mock).mockResolvedValue(existingUser);

    await capturedCallback('access', 'refresh', profile, doneMock);

    expect(existingUser.save).not.toHaveBeenCalled();
    expect(doneMock).toHaveBeenCalledWith(null, existingUser, { isNewUser: false });
  });

  it('Debe actualizar el avatar si el usuario no tenía uno y hacer save', async () => {
    const profile = makeProfile();
    const existingUser = {
      _id: 'userId',
      email: 'juan@gmail.com',
      avatar: undefined,  // sin avatar
      googleId: 'google-profile-id',
      provider: 'google',
      save: jest.fn().mockResolvedValue(true),
    };

    (UserModel.findOne as jest.Mock).mockResolvedValue(existingUser);

    await capturedCallback('access', 'refresh', profile, doneMock);

    expect(existingUser.avatar).toBe('https://photo.url/avatar.jpg');
    expect(existingUser.save).toHaveBeenCalled();
    expect(doneMock).toHaveBeenCalledWith(null, existingUser, { isNewUser: false });
  });

  it('Debe actualizar googleId si el usuario no lo tenía', async () => {
    const profile = makeProfile();
    const existingUser = {
      _id: 'userId',
      email: 'juan@gmail.com',
      avatar: 'https://existing.avatar.jpg',
      googleId: undefined,  // sin googleId
      provider: 'google',
      save: jest.fn().mockResolvedValue(true),
    };

    (UserModel.findOne as jest.Mock).mockResolvedValue(existingUser);

    await capturedCallback('access', 'refresh', profile, doneMock);

    expect(existingUser.googleId).toBe('google-profile-id');
    expect(existingUser.save).toHaveBeenCalled();
  });

  it('Debe actualizar provider a "google" si era diferente', async () => {
    const profile = makeProfile();
    const existingUser = {
      _id: 'userId',
      email: 'juan@gmail.com',
      avatar: 'https://avatar.jpg',
      googleId: 'google-profile-id',
      provider: 'local',  // provider local
      save: jest.fn().mockResolvedValue(true),
    };

    (UserModel.findOne as jest.Mock).mockResolvedValue(existingUser);

    await capturedCallback('access', 'refresh', profile, doneMock);

    expect(existingUser.provider).toBe('google');
    expect(existingUser.save).toHaveBeenCalled();
  });

  it('Debe llamar done(error) si UserModel.findOne lanza una excepción', async () => {
    const profile = makeProfile();
    (UserModel.findOne as jest.Mock).mockRejectedValue(new Error('DB connection failed'));

    await capturedCallback('access', 'refresh', profile, doneMock);

    expect(doneMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'DB connection failed' }),
      undefined
    );
  });

  it('Debe normalizar el email a minúsculas y sin espacios', async () => {
    const profile = makeProfile({ emails: [{ value: '  JUAN@GMAIL.COM  ' }] });
    const mockUser = { _id: 'id', name: 'Juan', email: 'juan@gmail.com', googleId: 'gid', provider: 'google', save: jest.fn() };

    (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);

    await capturedCallback('access', 'refresh', profile, doneMock);

    expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'juan@gmail.com' });
  });
});
