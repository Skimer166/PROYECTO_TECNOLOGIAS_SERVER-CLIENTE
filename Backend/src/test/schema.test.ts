import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UserModel } from '../app/users/model';
import { AgentModel } from '../app/agents/model';
import { FileModel } from '../app/documents/model';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // Ensure all unique/sparse indexes are built before tests run
  await Promise.all([
    UserModel.syncIndexes(),
    AgentModel.syncIndexes(),
    FileModel.syncIndexes(),
  ]);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key in cols) await cols[key].deleteMany({});
});

const validAgentBase = () => ({
  name: 'Agente Test',
  description: 'Descripción del agente',
  instructions: 'Sé útil.',
  modelVersion: 'gpt-4o',
  pricePerHour: 10,
  createdBy: new mongoose.Types.ObjectId(),
});

const validUserBase = (overrides: Record<string, unknown> = {}) => ({
  name: 'Test User',
  email: `user-${Date.now()}@test.com`,
  passwordHash: 'hashed_password',
  ...overrides,
});

// ─── UserModel schema ─────────────────────────────────────────────────────────

describe('UserModel schema validation', () => {
  it('crea usuario válido sin errores', async () => {
    const user = await UserModel.create(validUserBase());
    expect(user._id).toBeDefined();
  });

  it('role por defecto es "user"', async () => {
    const user = await UserModel.create(validUserBase());
    expect(user.role).toBe('user');
  });

  it('status por defecto es "active"', async () => {
    const user = await UserModel.create(validUserBase());
    expect(user.status).toBe('active');
  });

  it('provider por defecto es "local"', async () => {
    const user = await UserModel.create(validUserBase());
    expect(user.provider).toBe('local');
  });

  it('credits por defecto es 500', async () => {
    const user = await UserModel.create(validUserBase());
    expect(user.credits).toBe(500);
  });

  it('rechaza status inválido (enum violation)', async () => {
    await expect(
      UserModel.create(validUserBase({ status: 'inactive' }))
    ).rejects.toThrow();
  });

  it('rechaza role inválido (enum violation)', async () => {
    await expect(
      UserModel.create(validUserBase({ role: 'superuser' }))
    ).rejects.toThrow();
  });

  it('rechaza provider inválido (enum violation)', async () => {
    await expect(
      UserModel.create(validUserBase({ provider: 'twitter' }))
    ).rejects.toThrow();
  });

  it('rechaza credits negativos (min: 0)', async () => {
    await expect(
      UserModel.create(validUserBase({ credits: -1 }))
    ).rejects.toThrow();
  });

  it('requiere name', async () => {
    const { name, ...withoutName } = validUserBase();
    await expect(UserModel.create(withoutName)).rejects.toThrow();
  });

  it('requiere email', async () => {
    await expect(
      UserModel.create({ name: 'Test', passwordHash: 'hash' })
    ).rejects.toThrow();
  });

  it('requiere passwordHash cuando googleId no está presente', async () => {
    await expect(
      UserModel.create({ name: 'No Pass', email: 'nopass@test.com' })
    ).rejects.toThrow();
  });

  it('NO requiere passwordHash cuando googleId está presente', async () => {
    const user = await UserModel.create({
      name: 'Google User',
      email: 'google@test.com',
      googleId: 'google-id-123',
      provider: 'google',
    });
    expect(user._id).toBeDefined();
  });

  it('email único — segundo registro con mismo email lanza error', async () => {
    const email = 'dup@test.com';
    await UserModel.create(validUserBase({ email }));
    await expect(
      UserModel.create(validUserBase({ email, name: 'Otro' }))
    ).rejects.toThrow();
  });

  it('usuario eliminado después de crearse ya no existe en BD', async () => {
    const user = await UserModel.create(validUserBase());
    await UserModel.findByIdAndDelete(user._id);
    const found = await UserModel.findById(user._id);
    expect(found).toBeNull();
  });

  it('timestamps: createdAt y updatedAt se establecen al crear', async () => {
    const before = new Date();
    const user = await UserModel.create(validUserBase());
    const after = new Date();

    const raw = user.toObject() as Record<string, unknown>;
    expect(raw['createdAt']).toBeDefined();
    expect(new Date(raw['createdAt'] as string).getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(new Date(raw['createdAt'] as string).getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

// ─── AgentModel schema ────────────────────────────────────────────────────────

describe('AgentModel schema validation', () => {
  it('crea agente válido sin errores', async () => {
    const agent = await AgentModel.create(validAgentBase());
    expect(agent._id).toBeDefined();
  });

  it('category por defecto es "otros"', async () => {
    const agent = await AgentModel.create(validAgentBase());
    expect(agent.category).toBe('otros');
  });

  it('availability por defecto es true', async () => {
    const agent = await AgentModel.create(validAgentBase());
    expect(agent.availability).toBe(true);
  });

  it('language por defecto es "es"', async () => {
    const agent = await AgentModel.create(validAgentBase());
    expect(agent.language).toBe('es');
  });

  it('rechaza category inválida (enum violation)', async () => {
    await expect(
      AgentModel.create({ ...validAgentBase(), category: 'malware' })
    ).rejects.toThrow();
  });

  it('acepta todas las categorías válidas del enum', async () => {
    const categories = ['marketing', 'salud', 'educacion', 'asistente', 'otros'];
    for (const category of categories) {
      const agent = await AgentModel.create({
        ...validAgentBase(),
        name: `Agent-${category}`,
        category,
      });
      expect(agent.category).toBe(category);
    }
  });

  it('rechaza ratings.average mayor a 5 (max: 5)', async () => {
    await expect(
      AgentModel.create({ ...validAgentBase(), ratings: { average: 6, totalReviews: 1 } })
    ).rejects.toThrow();
  });

  it('rechaza ratings.average menor a 0 (min: 0)', async () => {
    await expect(
      AgentModel.create({ ...validAgentBase(), ratings: { average: -1, totalReviews: 1 } })
    ).rejects.toThrow();
  });

  it('ratings.average por defecto es 0', async () => {
    const agent = await AgentModel.create(validAgentBase());
    expect(agent.ratings?.average).toBe(0);
  });

  it('rechaza pricePerHour negativo (min: 0)', async () => {
    await expect(
      AgentModel.create({ ...validAgentBase(), pricePerHour: -1 })
    ).rejects.toThrow();
  });

  it('acepta pricePerHour = 0 (gratuito)', async () => {
    const agent = await AgentModel.create({ ...validAgentBase(), pricePerHour: 0 });
    expect(agent.pricePerHour).toBe(0);
  });

  it('requiere name', async () => {
    const { name, ...withoutName } = validAgentBase();
    await expect(AgentModel.create(withoutName)).rejects.toThrow();
  });

  it('requiere description', async () => {
    const { description, ...withoutDesc } = validAgentBase();
    await expect(AgentModel.create(withoutDesc)).rejects.toThrow();
  });

  it('requiere instructions', async () => {
    const { instructions, ...withoutInstr } = validAgentBase();
    await expect(AgentModel.create(withoutInstr)).rejects.toThrow();
  });

  it('requiere modelVersion', async () => {
    const { modelVersion, ...withoutModel } = validAgentBase();
    await expect(AgentModel.create(withoutModel)).rejects.toThrow();
  });

  it('requiere createdBy', async () => {
    const { createdBy, ...withoutCreator } = validAgentBase();
    await expect(AgentModel.create(withoutCreator)).rejects.toThrow();
  });

  it('timestamps: createdAt y updatedAt se establecen al crear', async () => {
    const before = new Date();
    const agent = await AgentModel.create(validAgentBase());
    expect(new Date(agent.createdAt).getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('updatedAt cambia después de una actualización', async () => {
    const agent = await AgentModel.create(validAgentBase());
    const originalUpdatedAt = agent.updatedAt;

    await new Promise(r => setTimeout(r, 10)); // ensure time passes
    agent.name = 'Modified Name';
    await agent.save();

    expect(new Date(agent.updatedAt).getTime()).toBeGreaterThan(
      new Date(originalUpdatedAt).getTime()
    );
  });
});

// ─── FileModel schema ─────────────────────────────────────────────────────────

describe('FileModel schema validation', () => {
  const ownerId = new mongoose.Types.ObjectId();

  const validFileBase = (overrides: Record<string, unknown> = {}) => ({
    ownerId,
    key: `uploads/${Date.now()}/photo.png`,
    bucket: 'test-bucket',
    contentType: 'image/png',
    size: 2048,
    ...overrides,
  });

  it('crea archivo válido sin errores', async () => {
    const file = await FileModel.create(validFileBase());
    expect(file._id).toBeDefined();
  });

  it('public por defecto es false', async () => {
    const file = await FileModel.create(validFileBase());
    expect(file.public).toBe(false);
  });

  it('requiere ownerId', async () => {
    const { ownerId: _, ...withoutOwner } = validFileBase();
    await expect(FileModel.create(withoutOwner)).rejects.toThrow();
  });

  it('requiere key', async () => {
    const { key: _, ...withoutKey } = validFileBase();
    await expect(FileModel.create(withoutKey)).rejects.toThrow();
  });

  it('requiere bucket', async () => {
    const { bucket: _, ...withoutBucket } = validFileBase();
    await expect(FileModel.create(withoutBucket)).rejects.toThrow();
  });

  it('requiere contentType', async () => {
    const { contentType: _, ...withoutCT } = validFileBase();
    await expect(FileModel.create(withoutCT)).rejects.toThrow();
  });

  it('requiere size', async () => {
    const { size: _, ...withoutSize } = validFileBase();
    await expect(FileModel.create(withoutSize)).rejects.toThrow();
  });

  it('key único — duplicado lanza error', async () => {
    const key = 'uploads/shared/unique.png';
    await FileModel.create(validFileBase({ key }));
    await expect(
      FileModel.create(validFileBase({ key }))
    ).rejects.toThrow();
  });

  it('timestamps: createdAt se establece al crear', async () => {
    const before = new Date();
    const file = await FileModel.create(validFileBase());
    expect(new Date(file.createdAt!).getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('ownerId es de tipo ObjectId', async () => {
    const file = await FileModel.create(validFileBase());
    expect(file.ownerId).toBeInstanceOf(mongoose.Types.ObjectId);
  });
});

// ─── CastError handling ───────────────────────────────────────────────────────

describe('Mongoose CastError behavior', () => {
  it('findById con ID inválido lanza CastError', async () => {
    await expect(
      UserModel.findById('not-a-valid-id').exec()
    ).rejects.toThrow('Cast to ObjectId failed');
  });

  it('findById con ID válido pero inexistente retorna null', async () => {
    const result = await UserModel.findById('507f1f77bcf86cd799439011').exec();
    expect(result).toBeNull();
  });

  it('AgentModel.findById con ID inválido lanza CastError', async () => {
    await expect(
      AgentModel.findById('bad-id').exec()
    ).rejects.toThrow('Cast to ObjectId failed');
  });
});
