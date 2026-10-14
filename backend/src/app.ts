import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { generateToken, hashToken, hashPassword, verifyPassword } from './crypto';

const maxMarkdownBytes = Number(process.env.MAX_MARKDOWN_BYTES) || 262144;
const publicBaseUrl = process.env.PUBLIC_BASE_URL || '';

export const prisma = new PrismaClient();

const createDocumentSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty').max(maxMarkdownBytes, 'Content is too large'),
  isPrivate: z.boolean().optional().default(false),
  password: z.string().optional(),
});

const updateDocumentSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty').max(maxMarkdownBytes, 'Content is too large'),
  password: z.string().optional(),
});

const authDocumentSchema = z.object({
  password: z.string().min(1, 'Password required'),
});

export async function buildApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
    bodyLimit: maxMarkdownBytes + 1024,
    trustProxy: true,
  });

  await app.register(helmet);
  await app.register(cors, { origin: '*' });

  await app.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX) || 10,
    timeWindow: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  });

  app.get('/api/health', async () => {
    return { status: 'ok' };
  });

  app.post('/api/documents', async (request, reply) => {
    try {
      const parsed = createDocumentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.errors[0].message });
      }

      const { content, isPrivate, password } = parsed.data;

      if (isPrivate && !password) {
        return reply.status(400).send({ error: 'Se requiere contraseña para documentos privados' });
      }

      const byteLength = Buffer.byteLength(content, 'utf8');
      if (byteLength > maxMarkdownBytes) {
        return reply.status(400).send({ error: 'Content exceeds byte size limit' });
      }

      const token = generateToken();
      const tokenHash = hashToken(token);
      let passwordHash = null;

      if (isPrivate && password) {
        passwordHash = hashPassword(password);
      }

      await prisma.document.create({
        data: {
          tokenHash,
          content,
          isPrivate,
          passwordHash,
        },
      });

      // Si publicBaseUrl no está definido, el frontend se encargará de construir la URL completa
      const url = publicBaseUrl ? `${publicBaseUrl}/s/${token}` : `/s/${token}`;
      return reply.status(201).send({ url, token });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  app.get('/api/documents/:token', async (request, reply) => {
    const { token } = request.params as { token: string };

    if (!token || typeof token !== 'string') {
      return reply.status(400).send({ error: 'Invalid token' });
    }

    const tokenHash = hashToken(token);

    try {
      const document = await prisma.document.findUnique({
        where: { tokenHash },
      });

      if (!document) {
        return reply.status(404).send({ error: 'Document not found' });
      }

      if (document.isPrivate) {
        return reply.send({
          isPrivate: true,
          content: null,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        });
      }

      return reply.send({
        isPrivate: false,
        content: document.content,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  app.post('/api/documents/:token/auth', async (request, reply) => {
    const { token } = request.params as { token: string };
    const parsed = authDocumentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.errors[0].message });
    }

    const tokenHash = hashToken(token);
    try {
      const document = await prisma.document.findUnique({
        where: { tokenHash },
      });

      if (!document) return reply.status(404).send({ error: 'Document not found' });
      if (!document.isPrivate || !document.passwordHash) {
        return reply.status(400).send({ error: 'Document is not private' });
      }

      const isValid = verifyPassword(parsed.data.password, document.passwordHash);
      if (!isValid) {
        return reply.status(401).send({ error: 'Contraseña incorrecta' });
      }

      return reply.send({
        isPrivate: true,
        content: document.content,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  app.put('/api/documents/:token', async (request, reply) => {
    const { token } = request.params as { token: string };
    const parsed = updateDocumentSchema.safeParse(request.body);
    
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.errors[0].message });
    }

    const { content, password } = parsed.data;
    const tokenHash = hashToken(token);

    try {
      const document = await prisma.document.findUnique({
        where: { tokenHash },
      });

      if (!document) return reply.status(404).send({ error: 'Document not found' });

      if (document.isPrivate) {
        if (!password || !document.passwordHash || !verifyPassword(password, document.passwordHash)) {
          return reply.status(401).send({ error: 'Contraseña incorrecta' });
        }
      }

      const byteLength = Buffer.byteLength(content, 'utf8');
      if (byteLength > maxMarkdownBytes) {
        return reply.status(400).send({ error: 'Content exceeds byte size limit' });
      }

      await prisma.document.update({
        where: { tokenHash },
        data: { content },
      });

      return reply.send({ success: true });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  return app;
}
