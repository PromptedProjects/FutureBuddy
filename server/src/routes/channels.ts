import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { listChannels, startChannel, stopChannel, sendChannelMessage } from '../services/channel-manager.service.js';

const enableBody = z.object({
  config: z.record(z.string()),
});

const testBody = z.object({
  target: z.string().min(1),
  message: z.string().min(1),
});

export async function channelRoutes(app: FastifyInstance): Promise<void> {
  /** List channels with status (green) */
  app.get('/channels', async () => {
    const channels = listChannels();
    return { ok: true, data: { channels } };
  });

  /** Enable/start a channel (yellow) */
  app.post('/channels/:type/enable', async (request, reply) => {
    const { type } = request.params as { type: string };
    const body = enableBody.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'config object is required' });
      return;
    }
    try {
      const started = await startChannel(type, body.data.config);
      if (!started) {
        reply.code(404).send({ ok: false, error: `Channel type "${type}" not registered` });
        return;
      }
      return { ok: true, data: { type, enabled: true } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to start channel' };
    }
  });

  /** Disable/stop a channel (green) */
  app.post('/channels/:type/disable', async (request, reply) => {
    const { type } = request.params as { type: string };
    const stopped = await stopChannel(type);
    if (!stopped) {
      reply.code(404).send({ ok: false, error: `Channel type "${type}" not registered` });
      return;
    }
    return { ok: true, data: { type, enabled: false } };
  });

  /** Test a channel by sending a message (green) */
  app.post('/channels/:type/test', async (request, reply) => {
    const { type } = request.params as { type: string };
    const body = testBody.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'target and message are required' });
      return;
    }
    try {
      const sent = await sendChannelMessage(type, body.data.target, body.data.message);
      if (!sent) {
        reply.code(400).send({ ok: false, error: 'Channel not running or not found' });
        return;
      }
      return { ok: true, data: { sent: true } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to send message' };
    }
  });
}
