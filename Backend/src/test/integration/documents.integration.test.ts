import { PassThrough } from 'stream';

const mockDeleteObject = jest.fn();
const mockGetObject = jest.fn();

// Multer middleware factory — plain function, not jest.fn(), so resetMocks won't clear it
jest.mock('../../app/storage/s3', () => {
  const multerMiddleware = (req: Record<string, unknown>, _res: unknown, next: () => void) => {
    req.file = {
      fieldname: 'file',
      originalname: 'photo.png',
      encoding: '7bit',
      mimetype: 'image/png',
      key: 'uploads/test-user/photo.png',
      bucket: 'test-bucket',
      location: 'https://s3.test-bucket.amazonaws.com/uploads/test-user/photo.png',
      size: 2048,
    };
    next();
  };
  return {
    bucketName: 'test-bucket',
    deleteObject: mockDeleteObject,
    getObject: mockGetObject,
    createImageUpload: () => ({ single: () => multerMiddleware }),
    uploadMiddleware: { single: () => multerMiddleware },
    s3: {},
    s3Client: {},
  };
});

jest.mock('../../app/mailer/controller', () => ({
  sendEmail: jest.fn((_req: unknown, res: { send: (s: string) => void }) => res.send('ok')),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import { Types } from 'mongoose';
import app from '../../app';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup/db';
import { createUser, authHeader } from './setup/helpers';
import { FileModel } from '../../app/documents/model';

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
afterEach(() => clearTestDb());

beforeEach(() => {
  mockDeleteObject.mockResolvedValue({});
  // Use mockImplementation so each call gets a FRESH synchronous stream
  mockGetObject.mockImplementation(() => {
    const chunk = Buffer.from('fake image bytes'); // 16 bytes
    const body = new PassThrough();
    body.end(chunk);
    return Promise.resolve({ Body: body, ContentType: 'image/png', ContentLength: chunk.length });
  });
});

async function createFile(ownerId: string, overrides: Record<string, unknown> = {}) {
  return FileModel.create({
    ownerId: new Types.ObjectId(ownerId),
    key: overrides.key ?? `uploads/${ownerId}/photo.png`,
    bucket: 'test-bucket',
    contentType: 'image/png',
    size: 2048,
    originalName: 'photo.png',
    public: false,
    ...overrides,
  });
}

// ─── GET /files ───────────────────────────────────────────────────────────────

describe('GET /files', () => {
  it('200 — lista archivos del usuario autenticado', async () => {
    const user = await createUser({ email: 'lister@test.com' });
    await createFile(String(user._id));

    const res = await request(app).get('/files').set(authHeader(user));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.files)).toBe(true);
    expect(res.body.files.length).toBe(1);
    expect(res.body.files[0].key).toBe(`uploads/${user._id}/photo.png`);
  });

  it('200 — lista vacía si el usuario no tiene archivos', async () => {
    const user = await createUser({ email: 'empty@test.com' });

    const res = await request(app).get('/files').set(authHeader(user));

    expect(res.status).toBe(200);
    expect(res.body.files).toHaveLength(0);
  });

  it('200 — solo devuelve archivos propios (no los de otros usuarios)', async () => {
    const user1 = await createUser({ email: 'u1@test.com', name: 'U1' });
    const user2 = await createUser({ email: 'u2@test.com', name: 'U2' });
    await createFile(String(user1._id), { key: 'uploads/u1/file.png' });
    await createFile(String(user2._id), { key: 'uploads/u2/other.png' });

    const res = await request(app).get('/files').set(authHeader(user1));

    expect(res.status).toBe(200);
    expect(res.body.files).toHaveLength(1);
    expect(res.body.files[0].key).toBe('uploads/u1/file.png');
  });

  it('401 — sin token', async () => {
    const res = await request(app).get('/files');
    expect(res.status).toBe(401);
  });

  it('respuesta no expone campos sensibles internos', async () => {
    const user = await createUser({ email: 'safe@test.com' });
    await createFile(String(user._id));

    const res = await request(app).get('/files').set(authHeader(user));

    expect(res.status).toBe(200);
    const file = res.body.files[0];
    expect(file).not.toHaveProperty('ownerId');
    expect(file).not.toHaveProperty('__v');
  });
});

// ─── POST /files/upload ───────────────────────────────────────────────────────

describe('POST /files/upload', () => {
  it('201 — crea registro en DB y devuelve metadata del archivo', async () => {
    const user = await createUser({ email: 'uploader@test.com' });

    const res = await request(app)
      .post('/files/upload')
      .set(authHeader(user))
      .attach('file', Buffer.from('fake image'), 'photo.png');

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      key: 'uploads/test-user/photo.png',
      bucket: 'test-bucket',
      contentType: 'image/png',
    });
    expect(res.body).toHaveProperty('id');
  });

  it('201 — el archivo queda guardado en la BD', async () => {
    const user = await createUser({ email: 'uploader2@test.com' });

    await request(app)
      .post('/files/upload')
      .set(authHeader(user))
      .attach('file', Buffer.from('fake'), 'photo.png');

    const count = await FileModel.countDocuments({ ownerId: user._id });
    expect(count).toBe(1);
  });

  it('401 — sin token', async () => {
    const res = await request(app)
      .post('/files/upload')
      .attach('file', Buffer.from('fake'), 'photo.png');

    expect(res.status).toBe(401);
  });
});

// ─── GET /files/:id/download ──────────────────────────────────────────────────

describe('GET /files/:id/download', () => {
  it('200 — devuelve el contenido del archivo con headers correctos', async () => {
    const user = await createUser({ email: 'dl@test.com' });
    const file = await createFile(String(user._id));

    const res = await request(app).get(`/files/${file._id}/download`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
    expect(mockGetObject).toHaveBeenCalledWith(file.key);
  });

  it('404 — archivo no existe en BD', async () => {
    const res = await request(app).get('/files/507f1f77bcf86cd799439011/download');
    expect(res.status).toBe(404);
  });

  it('400 — ID con formato inválido', async () => {
    const res = await request(app).get('/files/not-an-id/download');
    expect(res.status).toBe(400);
  });

  it('500 — S3 lanza error al obtener objeto', async () => {
    const user = await createUser({ email: 'dl2@test.com' });
    const file = await createFile(String(user._id), { key: 'bad-key' });
    mockGetObject.mockRejectedValue(new Error('NoSuchKey'));

    const res = await request(app).get(`/files/${file._id}/download`);

    expect(res.status).toBe(500);
  });

  it('accesible sin token (la ruta no tiene verifyToken)', async () => {
    const user = await createUser({ email: 'public@test.com' });
    const file = await createFile(String(user._id));

    const res = await request(app).get(`/files/${file._id}/download`);

    // NOTE: This is a known security gap — download route has no auth guard
    expect(res.status).toBe(200);
  });
});

// ─── DELETE /files/:id ────────────────────────────────────────────────────────

describe('DELETE /files/:id', () => {
  it('204 — dueño del archivo puede eliminarlo', async () => {
    const user = await createUser({ email: 'del@test.com' });
    const file = await createFile(String(user._id));

    const res = await request(app)
      .delete(`/files/${file._id}`)
      .set(authHeader(user));

    expect(res.status).toBe(204);
    expect(await FileModel.findById(file._id)).toBeNull();
  });

  it('204 — elimina de la BD incluso si S3 falla (continúa sin S3)', async () => {
    const user = await createUser({ email: 'del2@test.com' });
    const file = await createFile(String(user._id), { key: 's3-fails.png' });
    mockDeleteObject.mockRejectedValue(new Error('S3 error'));

    const res = await request(app)
      .delete(`/files/${file._id}`)
      .set(authHeader(user));

    expect(res.status).toBe(204);
    expect(await FileModel.findById(file._id)).toBeNull();
  });

  it('403 — usuario que no es dueño no puede eliminar', async () => {
    const owner = await createUser({ email: 'owner@test.com', name: 'Owner' });
    const other = await createUser({ email: 'other@test.com', name: 'Other' });
    const file = await createFile(String(owner._id));

    const res = await request(app)
      .delete(`/files/${file._id}`)
      .set(authHeader(other));

    expect(res.status).toBe(403);
    expect(await FileModel.findById(file._id)).not.toBeNull();
  });

  it('404 — archivo no existe', async () => {
    const user = await createUser({ email: 'del3@test.com' });

    const res = await request(app)
      .delete('/files/507f1f77bcf86cd799439011')
      .set(authHeader(user));

    expect(res.status).toBe(404);
  });

  it('400 — ID inválido', async () => {
    const user = await createUser({ email: 'del4@test.com' });

    const res = await request(app)
      .delete('/files/not-an-id')
      .set(authHeader(user));

    expect(res.status).toBe(400);
  });

  it('401 — sin token', async () => {
    const user = await createUser({ email: 'del5@test.com' });
    const file = await createFile(String(user._id));

    const res = await request(app).delete(`/files/${file._id}`);

    expect(res.status).toBe(401);
  });
});
