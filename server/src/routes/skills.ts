import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { listSkills, getSkill, executeSkillAction, getToolDefinitions } from '../services/skills.service.js';

const executeBody = z.object({
  action: z.string().min(1),
  params: z.record(z.unknown()).optional(),
});

export async function skillsRoutes(app: FastifyInstance): Promise<void> {
  /** List all skills (green) */
  app.get('/skills', async () => {
    const skills = listSkills();
    return { ok: true, data: { skills } };
  });

  /** Get a specific skill (green) */
  app.get('/skills/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const skill = getSkill(id);
    if (!skill) {
      reply.code(404).send({ ok: false, error: 'Skill not found' });
      return;
    }
    return { ok: true, data: skill };
  });

  /** Execute a skill action (inherits tier) */
  app.post('/skills/:id/execute', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = executeBody.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ ok: false, error: 'action name is required' });
      return;
    }
    const result = await executeSkillAction(id, body.data.action, body.data.params ?? {});
    if (!result.success) {
      return { ok: false, error: result.error };
    }
    return { ok: true, data: result.result };
  });

  /** Get AI tool definitions (green) */
  app.get('/skills/tools', async () => {
    const tools = getToolDefinitions();
    return { ok: true, data: { tools } };
  });
}
