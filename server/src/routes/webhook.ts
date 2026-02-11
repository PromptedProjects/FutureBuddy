import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createWebhook, listWebhooks, deleteWebhookById, triggerWebhook } from '../services/webhook.service.js';

const createBody = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  action_type: z.string().min(1),
  action_payload: z.unknown().optional(),
  tier: z.enum(['red', 'yellow', 'green']),
  secret: z.string().optional(),
});

/** Protected webhook management routes (require auth) */
export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  /** List webhooks (green) */
  app.get('/webhooks', async () => {
    const webhooks = listWebhooks();
    return { ok: true, data: { webhooks } };
  });

  /** Create webhook (yellow) */
  app.post('/webhooks', async (request, reply) => {
    const body = createBody.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'Invalid webhook data' });
      return;
    }
    try {
      const webhook = createWebhook(body.data);
      return { ok: true, data: webhook };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to create webhook' };
    }
  });

  /** Delete webhook (yellow) */
  app.delete('/webhooks/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = deleteWebhookById(id);
    if (!deleted) {
      reply.code(404).send({ ok: false, error: 'Webhook not found' });
      return;
    }
    return { ok: true, data: { deleted: true } };
  });
}

/** Public webhook incoming route (no auth required) */
export async function webhookIncomingRoutes(app: FastifyInstance): Promise<void> {
  app.post('/webhooks/incoming/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const headers = request.headers as Record<string, string>;
    const result = triggerWebhook(slug, request.body, headers);
    if (!result) {
      reply.code(404).send({ ok: false, error: 'Webhook not found' });
      return;
    }
    return { ok: true, data: result };
  });
}
