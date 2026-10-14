import { describe, it, expect, vi } from 'vitest';
import { generateToken, hashToken } from '../src/crypto';
import { buildApp } from '../src/app';

// Mock prisma client
vi.mock('@prisma/client', () => {
  const mockPrisma = {
    document: {
      create: vi.fn().mockResolvedValue({ id: 'uuid', tokenHash: 'hash', content: 'test content' }),
      findUnique: vi.fn().mockImplementation(async ({ where }) => {
        if (where.tokenHash === 'known-hash') {
          return { id: 'uuid', tokenHash: 'known-hash', content: 'hello world', createdAt: new Date() };
        }
        return null;
      }),
    },
  };
  return { PrismaClient: vi.fn(() => mockPrisma) };
});

describe('Crypto utils', () => {
  it('generates random tokens of correct length', () => {
    const token = generateToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(30);
  });

  it('hashes token correctly', () => {
    const token = 'test-token';
    const hash = hashToken(token);
    expect(hash).toBe('4c5dc9b7708905f77f5e5d16316b5dfb425e68cb326dcd55a860e90a7707031e');
  });
});

describe('API Endpoints', () => {
  it('GET /api/health should return ok', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({ status: 'ok' });
  });

  it('POST /api/documents should fail on empty content', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/documents',
      payload: { content: '' },
    });
    
    expect(response.statusCode).toBe(400);
  });

  it('POST /api/documents should create document and return url', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/documents',
      payload: { content: '# Hello World' },
    });
    
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('url');
    expect(body).toHaveProperty('token');
  });
});
