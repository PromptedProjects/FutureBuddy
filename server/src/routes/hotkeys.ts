import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createHotkey, listHotkeys, deleteHotkey, updateHotkey } from '../services/hotkey.service.js';

const createBody = z.object({
  combo: z.string().min(1),
  action_type: z.string().min(1),
  action_payload: z.unknown().optional(),
  tier: z.enum(['red', 'yellow', 'green']).optional(),
});

const updateBody = z.object({
  combo: z.string().min(1).optional(),
  action_type: z.string().min(1).optional(),
  action_payload: z.unknown().optional(),
  enabled: z.boolean().optional(),
});

export async function hotkeyRoutes(app: FastifyInstance): Promise<void> {
  /** List hotkey bindings (green) */
  app.get('/hotkeys', async () => {
    const hotkeys = listHotkeys();
    return { ok: true, data: { hotkeys } };
  });

  /** Create hotkey binding (yellow) */
  app.post('/hotkeys', async (request, reply) => {
    const body = createBody.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'combo and action_type are required' });
      return;
    }
    try {
      const hotkey = createHotkey(
        body.data.combo,
        body.data.action_type,
        body.data.action_payload,
        body.data.tier,
      );
      return { ok: true, data: hotkey };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to create hotkey' };
    }
  });

  /** Update hotkey binding (yellow) */
  app.put('/hotkeys/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateBody.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'Invalid update data' });
      return;
    }
    const updated = updateHotkey(id, {
      ...body.data,
      action_payload: body.data.action_payload !== undefined
        ? JSON.stringify(body.data.action_payload)
        : undefined,
    });
    if (!updated) {
      reply.code(404).send({ ok: false, error: 'Hotkey not found' });
      return;
    }
    return { ok: true, data: { updated: true } };
  });

  /** Delete hotkey binding (yellow) */
  app.delete('/hotkeys/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = deleteHotkey(id);
    if (!deleted) {
      reply.code(404).send({ ok: false, error: 'Hotkey not found' });
      return;
    }
    return { ok: true, data: { deleted: true } };
  });
}
