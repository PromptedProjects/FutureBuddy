import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getVolume, setVolume, mute, unmute, toggleMute } from '../services/audio.service.js';

const volumeBody = z.object({
  level: z.number().min(0).max(100),
});

export async function audioRoutes(app: FastifyInstance): Promise<void> {
  /** Get current volume (green) */
  app.get('/audio/volume', async () => {
    try {
      const level = getVolume();
      return { ok: true, data: { level } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to get volume' };
    }
  });

  /** Set volume (green) */
  app.post('/audio/volume', async (request, reply) => {
    const body = volumeBody.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'level (0-100) is required' });
      return;
    }
    try {
      setVolume(body.data.level);
      return { ok: true, data: { level: body.data.level } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to set volume' };
    }
  });

  /** Mute (green) */
  app.post('/audio/mute', async () => {
    try {
      mute();
      return { ok: true, data: { muted: true } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to mute' };
    }
  });

  /** Unmute (green) */
  app.post('/audio/unmute', async () => {
    try {
      unmute();
      return { ok: true, data: { muted: false } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to unmute' };
    }
  });

  /** Toggle mute (green) */
  app.post('/audio/toggle', async () => {
    try {
      toggleMute();
      return { ok: true, data: { toggled: true } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to toggle mute' };
    }
  });
}
