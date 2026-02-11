import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sendDesktopNotification } from '../services/notification.service.js';

const notifyBody = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  icon: z.string().optional(),
  sound: z.boolean().optional(),
});

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  /** Send desktop notification (green) */
  app.post('/notifications/desktop', async (request, reply) => {
    const body = notifyBody.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'title and message are required' });
      return;
    }
    try {
      sendDesktopNotification(body.data);
      return { ok: true, data: { sent: true } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to send notification' };
    }
  });
}
