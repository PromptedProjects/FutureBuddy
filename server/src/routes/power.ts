import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { shutdown, restart, sleep, lock, cancelShutdown } from '../services/power.service.js';

const delayBody = z.object({
  delay: z.number().int().min(0).max(3600).optional(),
});

export async function powerRoutes(app: FastifyInstance): Promise<void> {
  /** Shutdown (red) */
  app.post('/power/shutdown', async (request) => {
    const body = delayBody.safeParse(request.body);
    const delay = body.success ? body.data.delay ?? 30 : 30;
    try {
      shutdown(delay);
      return { ok: true, data: { action: 'shutdown', delay } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Shutdown failed' };
    }
  });

  /** Restart (red) */
  app.post('/power/restart', async (request) => {
    const body = delayBody.safeParse(request.body);
    const delay = body.success ? body.data.delay ?? 30 : 30;
    try {
      restart(delay);
      return { ok: true, data: { action: 'restart', delay } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Restart failed' };
    }
  });

  /** Sleep (red) */
  app.post('/power/sleep', async () => {
    try {
      sleep();
      return { ok: true, data: { action: 'sleep' } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Sleep failed' };
    }
  });

  /** Lock workstation (yellow) */
  app.post('/power/lock', async () => {
    try {
      lock();
      return { ok: true, data: { action: 'lock' } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Lock failed' };
    }
  });

  /** Cancel pending shutdown (green) */
  app.post('/power/cancel', async () => {
    try {
      cancelShutdown();
      return { ok: true, data: { action: 'cancel' } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Cancel failed' };
    }
  });
}
