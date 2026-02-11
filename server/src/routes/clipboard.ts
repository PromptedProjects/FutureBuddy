import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { readClipboard, writeClipboard } from '../services/clipboard.service.js';

const writeBody = z.object({
  text: z.string(),
});

export async function clipboardRoutes(app: FastifyInstance): Promise<void> {
  /** Read clipboard content (green) */
  app.get('/clipboard', async (_request, _reply) => {
    try {
      const text = readClipboard();
      return { ok: true, data: { text } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to read clipboard' };
    }
  });

  /** Write text to clipboard (yellow) */
  app.post('/clipboard', async (request, reply) => {
    const body = writeBody.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'text is required' });
      return;
    }
    try {
      writeClipboard(body.data.text);
      return { ok: true, data: { written: true } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to write clipboard' };
    }
  });
}
