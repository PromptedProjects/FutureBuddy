import { getDatabase } from '../database.js';

export interface ScheduledTask {
  id: string;
  name: string;
  cron: string;
  action_type: string;
  action_payload: string | null;
  tier: string;
  enabled: number;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}

export function createScheduledTask(task: {
  id: string;
  name: string;
  cron: string;
  action_type: string;
  action_payload?: string | null;
  tier: string;
}): void {
  const db = getDatabase();
  db.prepare(
    `INSERT INTO scheduled_tasks (id, name, cron, action_type, action_payload, tier)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(task.id, task.name, task.cron, task.action_type, task.action_payload ?? null, task.tier);
}

export function getScheduledTask(id: string): ScheduledTask | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM scheduled_tasks WHERE id = ?').get(id) as unknown as ScheduledTask | undefined;
}

export function listScheduledTasks(): ScheduledTask[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM scheduled_tasks ORDER BY created_at DESC').all() as unknown as ScheduledTask[];
}

export function updateScheduledTask(id: string, updates: {
  name?: string;
  cron?: string;
  action_type?: string;
  action_payload?: string | null;
  tier?: string;
}): boolean {
  const db = getDatabase();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) { sets.push('name = ?'); values.push(updates.name); }
  if (updates.cron !== undefined) { sets.push('cron = ?'); values.push(updates.cron); }
  if (updates.action_type !== undefined) { sets.push('action_type = ?'); values.push(updates.action_type); }
  if (updates.action_payload !== undefined) { sets.push('action_payload = ?'); values.push(updates.action_payload); }
  if (updates.tier !== undefined) { sets.push('tier = ?'); values.push(updates.tier); }

  if (sets.length === 0) return false;
  values.push(id);

  const result = db.prepare(`UPDATE scheduled_tasks SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

export function deleteScheduledTask(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM scheduled_tasks WHERE id = ?').run(id);
  return result.changes > 0;
}

export function setTaskEnabled(id: string, enabled: boolean): boolean {
  const db = getDatabase();
  const result = db.prepare('UPDATE scheduled_tasks SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id);
  return result.changes > 0;
}

export function updateLastRun(id: string): void {
  const db = getDatabase();
  db.prepare("UPDATE scheduled_tasks SET last_run_at = datetime('now') WHERE id = ?").run(id);
}

export function updateNextRun(id: string, nextRun: string | null): void {
  const db = getDatabase();
  db.prepare('UPDATE scheduled_tasks SET next_run_at = ? WHERE id = ?').run(nextRun, id);
}
