import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

// Désactiver les logs pendant les tests
jest.mock('../config/redis', () => {
  const mockRedis = {
    get:        jest.fn().mockResolvedValue(null),
    set:        jest.fn().mockResolvedValue('OK'),
    setex:      jest.fn().mockResolvedValue('OK'),
    setEx:      jest.fn().mockResolvedValue('OK'),
    del:        jest.fn().mockResolvedValue(1),
    keys:       jest.fn().mockResolvedValue([]),
    scan:       jest.fn().mockResolvedValue(['0', []]),
    // rate-limit-redis attend [hits, resetTimestamp] depuis EVALSHA/EVAL
    call:        jest.fn().mockResolvedValue([1, Date.now() + 60_000]),
    sendCommand: jest.fn().mockResolvedValue([1, Date.now() + 60_000]),
    connect:    jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on:         jest.fn(),
    status:     'ready',
    ttl:        jest.fn().mockResolvedValue(1800),  // 30 min par défaut
  };
  return {
    __esModule: true,
    default: mockRedis,
    redis: mockRedis,
    redisPub: mockRedis,
    redisSub: mockRedis,
    connectRedis: jest.fn().mockResolvedValue(undefined),
  };
});

// Mock socket.io
jest.mock('../config/socket', () => ({
  getIO: jest.fn().mockReturnValue({ to: jest.fn().mockReturnThis(), emit: jest.fn() }),
  initSocket: jest.fn(),
}));

// Mock BullMQ queues
jest.mock('../config/queue', () => ({
  emailQueue: { add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }) },
  notificationQueue: { add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }) },
  invoiceQueue: { add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }) },
  queueEmail: jest.fn().mockResolvedValue(undefined),
  queueNotification: jest.fn().mockResolvedValue(undefined),
  queueInvoice: jest.fn().mockResolvedValue(undefined),
}));

// Mock rate limiter — passthrough en tests (évite les dépendances Redis complexes)
const passthrough = (_req: unknown, _res: unknown, next: () => void) => next();
jest.mock('../middleware/rateLimiter.middleware', () => ({
  generalLimiter: passthrough,
  authLimiter:    passthrough,
  uploadLimiter:  passthrough,
  paymentLimiter: passthrough,
  createLimiter:  () => passthrough,
}));

// Mock Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
    },
  },
}));

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  // Nettoyer toutes les collections entre chaque test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  jest.clearAllMocks();
});
