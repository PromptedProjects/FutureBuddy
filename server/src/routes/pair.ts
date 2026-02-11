import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createPairingToken, pair, isPairingEnabled, setPairingEnabled } from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const pairBodySchema = z.object({
  token: z.string().min(1),
  device_name: z.string().optional(),
});

export async function pairRoutes(app: FastifyInstance): Promise<void> {
  /** Generate a pairing token (called from the FutureBox device itself) */
  app.post('/pair/create', {
    config: { rateLimit: { max: 5, timeWindow: 60_000 } },
  }, async (_request, reply) => {
    if (!isPairingEnabled()) {
      reply.code(403).send({ ok: false, error: 'Pairing is locked' });
      return;
    }
    const { token, expiresAt } = createPairingToken();
    return { ok: true, data: { token, expires_at: new Date(expiresAt).toISOString() } };
  });

  /** Exchange a pairing token for a session token (called from the companion app) */
  app.post('/pair', {
    config: { rateLimit: { max: 5, timeWindow: 60_000 } },
  }, async (request, reply) => {
    if (!isPairingEnabled()) {
      reply.code(403).send({ ok: false, error: 'Pairing is locked' });
      return;
    }

    const body = pairBodySchema.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'Invalid request body' });
      return;
    }

    const sessionToken = pair(body.data.token, body.data.device_name);

    if (!sessionToken) {
      reply.code(401).send({ ok: false, error: 'Invalid or expired pairing token' });
      return;
    }

    return { ok: true, data: { session_token: sessionToken } };
  });

  /** Check pairing status (public — used by app to show lock state) */
  app.get('/pair/status', async () => {
    return { ok: true, data: { pairing_enabled: isPairingEnabled() } };
  });

  /** Lock pairing (authed — only paired devices can lock) */
  app.post('/pair/lock', { preHandler: requireAuth }, async () => {
    setPairingEnabled(false);
    return { ok: true, data: { pairing_enabled: false } };
  });

  /** Unlock pairing (authed — only paired devices can unlock) */
  app.post('/pair/unlock', { preHandler: requireAuth }, async () => {
    setPairingEnabled(true);
    return { ok: true, data: { pairing_enabled: true } };
  });
}
