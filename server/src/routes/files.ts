import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  listDirectory, readTextFile, getDefaultRoot,
  writeTextFile, createDirectory, deleteFile, deleteDirectory, moveFile, copyFile,
} from '../services/files.service.js';

const pathQuery = z.object({
  path: z.string().min(1).optional(),
});

const writeBody = z.object({
  path: z.string().min(1),
  content: z.string(),
});

const mkdirBody = z.object({
  path: z.string().min(1),
});

const deleteBody = z.object({
  path: z.string().min(1),
  type: z.enum(['file', 'directory']).optional(),
});

const moveBody = z.object({
  src: z.string().min(1),
  dest: z.string().min(1),
});

const copyBody = z.object({
  src: z.string().min(1),
  dest: z.string().min(1),
});

export async function filesRoutes(app: FastifyInstance): Promise<void> {
  /** List directory contents */
  app.get('/files/list', async (request, reply) => {
    const query = pathQuery.safeParse(request.query);
    const dirPath = query.success && query.data.path ? query.data.path : getDefaultRoot();

    try {
      const entries = listDirectory(dirPath);
      return { ok: true, data: { path: dirPath, entries } };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to list directory';
      const code = message.includes('not found') ? 404
        : message.includes('Access denied') ? 403
        : 400;
      reply.code(code).send({ ok: false, error: message });
    }
  });

  /** Read text file content (preview) */
  app.get('/files/read', async (request, reply) => {
    const query = pathQuery.safeParse(request.query);
    if (!query.success || !query.data.path) {
      reply.code(400).send({ ok: false, error: 'path query parameter is required' });
      return;
    }

    try {
      const content = readTextFile(query.data.path);
      return { ok: true, data: { path: query.data.path, content } };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to read file';
      const code = message.includes('not found') ? 404
        : message.includes('Access denied') ? 403
        : 400;
      reply.code(code).send({ ok: false, error: message });
    }
  });

  /** Write text file (yellow) */
  app.post('/files/write', async (request, reply) => {
    const body = writeBody.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'path and content are required' });
      return;
    }
    try {
      writeTextFile(body.data.path, body.data.content);
      return { ok: true, data: { path: body.data.path } };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to write file';
      const code = message.includes('Access denied') ? 403 : 400;
      reply.code(code).send({ ok: false, error: message });
    }
  });

  /** Create directory (yellow) */
  app.post('/files/mkdir', async (request, reply) => {
    const body = mkdirBody.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'path is required' });
      return;
    }
    try {
      createDirectory(body.data.path);
      return { ok: true, data: { path: body.data.path } };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create directory';
      const code = message.includes('Access denied') ? 403 : 400;
      reply.code(code).send({ ok: false, error: message });
    }
  });

  /** Delete file or directory (red) */
  app.delete('/files/delete', async (request, reply) => {
    const body = deleteBody.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'path is required' });
      return;
    }
    try {
      if (body.data.type === 'directory') {
        deleteDirectory(body.data.path);
      } else {
        deleteFile(body.data.path);
      }
      return { ok: true, data: { path: body.data.path } };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      const code = message.includes('not found') ? 404 : message.includes('Access denied') ? 403 : 400;
      reply.code(code).send({ ok: false, error: message });
    }
  });

  /** Move/rename file or directory (yellow) */
  app.post('/files/move', async (request, reply) => {
    const body = moveBody.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'src and dest are required' });
      return;
    }
    try {
      moveFile(body.data.src, body.data.dest);
      return { ok: true, data: { src: body.data.src, dest: body.data.dest } };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to move';
      const code = message.includes('not found') ? 404 : message.includes('Access denied') ? 403 : 400;
      reply.code(code).send({ ok: false, error: message });
    }
  });

  /** Copy file (green) */
  app.post('/files/copy', async (request, reply) => {
    const body = copyBody.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'src and dest are required' });
      return;
    }
    try {
      copyFile(body.data.src, body.data.dest);
      return { ok: true, data: { src: body.data.src, dest: body.data.dest } };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to copy';
      const code = message.includes('not found') ? 404 : message.includes('Access denied') ? 403 : 400;
      reply.code(code).send({ ok: false, error: message });
    }
  });
}
