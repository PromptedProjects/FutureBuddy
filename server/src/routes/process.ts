import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { listProcesses, getProcessInfo, killProcess, launchApp } from '../services/process.service.js';

const launchBody = z.object({
  command: z.string().min(1),
  args: z.array(z.string()).optional(),
  cwd: z.string().optional(),
});

const killBody = z.object({
  force: z.boolean().optional(),
});

export async function processRoutes(app: FastifyInstance): Promise<void> {
  /** List running processes (green) */
  app.get('/processes', async () => {
    const procs = await listProcesses();
    return { ok: true, data: { processes: procs } };
  });

  /** Get specific process info (green) */
  app.get('/processes/:pid', async (request, reply) => {
    const { pid } = request.params as { pid: string };
    const pidNum = parseInt(pid, 10);
    if (isNaN(pidNum)) {
      reply.code(400).send({ ok: false, error: 'Invalid PID' });
      return;
    }
    const info = await getProcessInfo(pidNum);
    if (!info) {
      reply.code(404).send({ ok: false, error: 'Process not found' });
      return;
    }
    return { ok: true, data: info };
  });

  /** Launch an application (red) */
  app.post('/processes/launch', async (request, reply) => {
    const body = launchBody.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'command is required' });
      return;
    }
    try {
      const result = launchApp(body.data.command, body.data.args, body.data.cwd);
      return { ok: true, data: result };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to launch app' };
    }
  });

  /** Kill a process (red) */
  app.post('/processes/kill', async (request, reply) => {
    const body = killBody.safeParse(request.body);
    const { pid } = request.query as { pid: string };
    const pidNum = parseInt(pid, 10);
    if (isNaN(pidNum)) {
      reply.code(400).send({ ok: false, error: 'pid query parameter is required' });
      return;
    }
    const force = body.success ? body.data.force ?? false : false;
    const killed = killProcess(pidNum, force);
    if (!killed) {
      reply.code(404).send({ ok: false, error: 'Process not found or access denied' });
      return;
    }
    return { ok: true, data: { pid: pidNum, killed: true } };
  });
}
