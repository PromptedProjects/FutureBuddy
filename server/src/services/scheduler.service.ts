import { nanoid } from 'nanoid';
import {
  createScheduledTask as dbCreate,
  getScheduledTask,
  listScheduledTasks as dbList,
  updateScheduledTask as dbUpdate,
  deleteScheduledTask as dbDelete,
  setTaskEnabled as dbSetEnabled,
  updateLastRun,
  updateNextRun,
  type ScheduledTask,
} from '../storage/repositories/scheduler.repository.js';

// Dynamic import for croner (ESM)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let CronClass: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const activeCrons = new Map<string, any>();

async function getCron() {
  if (!CronClass) {
    const mod = await import('croner');
    CronClass = (mod as Record<string, unknown>).Cron ?? (mod as Record<string, unknown>).default;
  }
  return CronClass;
}

export interface CreateTaskInput {
  name: string;
  cron: string;
  action_type: string;
  action_payload?: unknown;
  tier: string;
}

/** Create a new scheduled task */
export async function createScheduledTask(input: CreateTaskInput): Promise<ScheduledTask> {
  const id = nanoid();
  dbCreate({
    id,
    name: input.name,
    cron: input.cron,
    action_type: input.action_type,
    action_payload: input.action_payload ? JSON.stringify(input.action_payload) : null,
    tier: input.tier,
  });

  await scheduleTask(id);
  return getScheduledTask(id)!;
}

/** Update an existing scheduled task */
export async function updateScheduledTaskById(id: string, updates: {
  name?: string;
  cron?: string;
  action_type?: string;
  action_payload?: unknown;
  tier?: string;
}): Promise<ScheduledTask | null> {
  const existing = getScheduledTask(id);
  if (!existing) return null;

  dbUpdate(id, {
    name: updates.name,
    cron: updates.cron,
    action_type: updates.action_type,
    action_payload: updates.action_payload !== undefined ? JSON.stringify(updates.action_payload) : undefined,
    tier: updates.tier,
  });

  // Reschedule if cron changed
  if (updates.cron) {
    unscheduleTask(id);
    await scheduleTask(id);
  }

  return getScheduledTask(id) ?? null;
}

/** Delete a scheduled task */
export function deleteScheduledTaskById(id: string): boolean {
  unscheduleTask(id);
  return dbDelete(id);
}

/** List all scheduled tasks */
export function listScheduledTasks(): ScheduledTask[] {
  return dbList();
}

/** Enable a task */
export async function enableTask(id: string): Promise<boolean> {
  const result = dbSetEnabled(id, true);
  if (result) await scheduleTask(id);
  return result;
}

/** Disable a task */
export function disableTask(id: string): boolean {
  unscheduleTask(id);
  return dbSetEnabled(id, false);
}

/** Run a task immediately */
export function runTaskNow(id: string): ScheduledTask | null {
  const task = getScheduledTask(id);
  if (!task) return null;

  updateLastRun(id);
  // In a real implementation, this would execute the action through the action system
  return getScheduledTask(id) ?? null;
}

/** Load and schedule all enabled tasks on startup */
export async function loadScheduledTasks(): Promise<void> {
  const tasks = dbList();
  for (const task of tasks) {
    if (task.enabled) {
      await scheduleTask(task.id);
    }
  }
}

async function scheduleTask(id: string): Promise<void> {
  const task = getScheduledTask(id);
  if (!task || !task.enabled) return;

  unscheduleTask(id);

  try {
    const Cron = await getCron();
    const job = new Cron(task.cron, () => {
      updateLastRun(id);
      // Compute next run
      const nextDate = job.nextRun();
      updateNextRun(id, nextDate ? nextDate.toISOString() : null);
    });

    // Set next run
    const nextDate = job.nextRun();
    updateNextRun(id, nextDate ? nextDate.toISOString() : null);

    activeCrons.set(id, job);
  } catch {
    // Invalid cron expression — silently skip
  }
}

function unscheduleTask(id: string): void {
  const existing = activeCrons.get(id);
  if (existing) {
    existing.stop();
    activeCrons.delete(id);
  }
}
