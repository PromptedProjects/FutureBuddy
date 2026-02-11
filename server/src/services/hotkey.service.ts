import { spawn, type ChildProcess } from 'node:child_process';
import { nanoid } from 'nanoid';
import { getDatabase } from '../storage/database.js';

export interface HotkeyBinding {
  id: string;
  combo: string;
  action_type: string;
  action_payload: string | null;
  tier: string;
  enabled: number;
  created_at: string;
}

let listenerProcess: ChildProcess | null = null;

/** Create a hotkey binding */
export function createHotkey(combo: string, actionType: string, actionPayload?: unknown, tier = 'green'): HotkeyBinding {
  const db = getDatabase();
  const id = nanoid();
  db.prepare(
    `INSERT INTO hotkeys (id, combo, action_type, action_payload, tier)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, combo, actionType, actionPayload ? JSON.stringify(actionPayload) : null, tier);
  return db.prepare('SELECT * FROM hotkeys WHERE id = ?').get(id) as unknown as HotkeyBinding;
}

/** List all hotkey bindings */
export function listHotkeys(): HotkeyBinding[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM hotkeys ORDER BY created_at DESC').all() as unknown as HotkeyBinding[];
}

/** Delete a hotkey binding */
export function deleteHotkey(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM hotkeys WHERE id = ?').run(id);
  return result.changes > 0;
}

/** Update a hotkey binding */
export function updateHotkey(id: string, updates: { combo?: string; action_type?: string; action_payload?: string | null; enabled?: boolean }): boolean {
  const db = getDatabase();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.combo !== undefined) { sets.push('combo = ?'); values.push(updates.combo); }
  if (updates.action_type !== undefined) { sets.push('action_type = ?'); values.push(updates.action_type); }
  if (updates.action_payload !== undefined) { sets.push('action_payload = ?'); values.push(updates.action_payload); }
  if (updates.enabled !== undefined) { sets.push('enabled = ?'); values.push(updates.enabled ? 1 : 0); }

  if (sets.length === 0) return false;
  values.push(id);

  const result = db.prepare(`UPDATE hotkeys SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

/** Start the global hotkey listener (PowerShell background script) */
export function startHotkeyListener(port: number): void {
  if (listenerProcess) return;

  // The hotkey listener is a lightweight PowerShell script
  // that registers global hotkeys and sends HTTP requests to localhost on trigger
  const scriptPath = new URL('../../scripts/hotkey-listener.ps1', import.meta.url).pathname.replace(/^\//, '');

  try {
    listenerProcess = spawn('powershell', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
      '-Port', String(port),
    ], {
      detached: true,
      stdio: 'ignore',
    });

    listenerProcess.unref();
    listenerProcess.on('exit', () => { listenerProcess = null; });
  } catch {
    // Hotkey listener is non-critical
  }
}

/** Stop the hotkey listener */
export function stopHotkeyListener(): void {
  if (listenerProcess) {
    listenerProcess.kill();
    listenerProcess = null;
  }
}
