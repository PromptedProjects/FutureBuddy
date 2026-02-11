import { getDatabase } from '../database.js';

export interface Session {
  id: string;
  token_hash: string;
  device_name: string | null;
  created_at: string;
  last_seen_at: string;
  revoked: number;
  expires_at: string | null;
}

const SESSION_EXPIRY_DAYS = 30;

export function createSession(id: string, tokenHash: string, deviceName?: string): void {
  const db = getDatabase();
  db.prepare(
    `INSERT INTO sessions (id, token_hash, device_name, expires_at)
     VALUES (?, ?, ?, datetime('now', '+${SESSION_EXPIRY_DAYS} days'))`
  ).run(id, tokenHash, deviceName ?? null);
}

export function findSessionByTokenHash(tokenHash: string): Session | undefined {
  const db = getDatabase();
  return db.prepare(
    `SELECT * FROM sessions
     WHERE token_hash = ? AND revoked = 0
       AND (expires_at IS NULL OR expires_at > datetime('now'))`
  ).get(tokenHash) as Session | undefined;
}

export function touchSession(id: string): void {
  const db = getDatabase();
  db.prepare(
    "UPDATE sessions SET last_seen_at = datetime('now') WHERE id = ?"
  ).run(id);
}

export function revokeSession(id: string): void {
  const db = getDatabase();
  db.prepare('UPDATE sessions SET revoked = 1 WHERE id = ?').run(id);
}

export function listActiveSessions(): Session[] {
  const db = getDatabase();
  return db.prepare(
    `SELECT * FROM sessions
     WHERE revoked = 0 AND (expires_at IS NULL OR expires_at > datetime('now'))
     ORDER BY last_seen_at DESC`
  ).all() as unknown as Session[];
}

/** Delete expired and revoked sessions */
export function purgeExpiredSessions(): number {
  const db = getDatabase();
  const result = db.prepare(
    `DELETE FROM sessions
     WHERE revoked = 1 OR (expires_at IS NOT NULL AND expires_at <= datetime('now'))`
  ).run();
  return Number(result.changes);
}
