import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  createScheduledTask,
  updateScheduledTaskById,
  deleteScheduledTaskById,
  listScheduledTasks,
  enableTask,
  disableTask,
  runTaskNow,
} from '../services/scheduler.service.js';

const createBody = z.object({
  name: z.string().min(1),
  cron: z.string().min(1),
  action_type: z.string().min(1),
  action_payload: z.unknown().optional(),
  tier: z.enum(['red', 'yellow', 'green']),
});

const updateBody = z.object({
  name: z.string().min(1).optional(),
  cron: z.string().min(1).optional(),
  action_type: z.string().min(1).optional(),
  action_payload: z.unknown().optional(),
  tier: z.enum(['red', 'yellow', 'green']).optional(),
});

export async function schedulerRoutes(app: FastifyInstance): Promise<void> {
  /** List scheduled tasks (green) */
  app.get('/tasks', async () => {
    const tasks = listScheduledTasks();
    return { ok: true, data: { tasks } };
  });

  /** Create scheduled task (yellow) */
  app.post('/tasks', async (request, reply) => {
    const body = createBody.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'Invalid task data' });
      return;
    }
    try {
      const task = await createScheduledTask(body.data);
      return { ok: true, data: task };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to create task' };
    }
  });

  /** Update scheduled task (yellow) */
  app.put('/tasks/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateBody.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'Invalid update data' });
      return;
    }
    const task = await updateScheduledTaskById(id, body.data);
    if (!task) {
      reply.code(404).send({ ok: false, error: 'Task not found' });
      return;
    }
    return { ok: true, data: task };
  });

  /** Delete scheduled task (yellow) */
  app.delete('/tasks/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = deleteScheduledTaskById(id);
    if (!deleted) {
      reply.code(404).send({ ok: false, error: 'Task not found' });
      return;
    }
    return { ok: true, data: { deleted: true } };
  });

  /** Run a task immediately (inherits tier) */
  app.post('/tasks/:id/run', async (request, reply) => {
    const { id } = request.params as { id: string };
    const task = runTaskNow(id);
    if (!task) {
      reply.code(404).send({ ok: false, error: 'Task not found' });
      return;
    }
    return { ok: true, data: task };
  });

  /** Enable a task (green) */
  app.post('/tasks/:id/enable', async (request, reply) => {
    const { id } = request.params as { id: string };
    const enabled = await enableTask(id);
    if (!enabled) {
      reply.code(404).send({ ok: false, error: 'Task not found' });
      return;
    }
    return { ok: true, data: { enabled: true } };
  });

  /** Disable a task (green) */
  app.post('/tasks/:id/disable', async (request, reply) => {
    const { id } = request.params as { id: string };
    const disabled = disableTask(id);
    if (!disabled) {
      reply.code(404).send({ ok: false, error: 'Task not found' });
      return;
    }
    return { ok: true, data: { enabled: false } };
  });
}
