import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getConfig, setConfig, getFullConfig } from '../services/config.service.js';

const setConfigBody = z.object({
  key: z.string().min(1),
  value: z.string(),
});

export async function configRoutes(app: FastifyInstance): Promise<void> {
  /** Get all config */
  app.get('/config', async () => ({
    ok: true,
    data: getFullConfig(),
  }));

  /** Get a single config value */
  app.get<{ Params: { key: string } }>('/config/:key', async (request) => ({
    ok: true,
    data: { key: request.params.key, value: getConfig(request.params.key) },
  }));

  /** Set a config value */
  app.put('/config', async (request, reply) => {
    const body = setConfigBody.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'key and value are required' });
      return;
    }
    setConfig(body.data.key, body.data.value);
    return { ok: true };
  });
}
