import { nanoid } from 'nanoid';
import { generatePairingToken, generateSessionToken, hashToken } from '../utils/crypto.js';
import { createSession, findSessionByTokenHash, touchSession } from '../storage/repositories/session.repository.js';
import { getDatabase } from '../storage/database.js';
import { getConfig } from '../config.js';

/** In-memory pairing tokens — short-lived, no need to persist */
interface PairingEntry {
  tokenHash: string;
  expiresAt: number;
}

const pairingTokens = new Map<string, PairingEntry>();

const PAIRING_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Create a new pairing token. Returns the raw token (show as QR code). */
export function createPairingToken(): { token: string; expiresAt: number } {
  const token = generatePairingToken();
  const expiresAt = Date.now() + PAIRING_TTL_MS;

  pairingTokens.set(hashToken(token), { tokenHash: hashToken(token), expiresAt });

  return { token, expiresAt };
}

/** Consume a pairing token and create a session. Returns session token or null. */
export function pair(pairingToken: string, deviceName?: string): string | null {
  const hash = hashToken(pairingToken);
  const entry = pairingTokens.get(hash);

  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    pairingTokens.delete(hash);
    return null;
  }

  // Consume — one-time use
  pairingTokens.delete(hash);

  // Create persistent session
  const sessionId = nanoid();
  const sessionToken = generateSessionToken();
  createSession(sessionId, hashToken(sessionToken), deviceName);

  return sessionToken;
}

/** Validate a session token. Returns session ID or null. */
export function validateSession(sessionToken: string): { sessionId: string } | null {
  const hash = hashToken(sessionToken);
  const session = findSessionByTokenHash(hash);

  if (!session) return null;

  touchSession(session.id);
  return { sessionId: session.id };
}

/** Clean up expired pairing tokens (call periodically) */
export function purgeExpiredPairingTokens(): number {
  const now = Date.now();
  let purged = 0;
  for (const [hash, entry] of pairingTokens) {
    if (now > entry.expiresAt) {
      pairingTokens.delete(hash);
      purged++;
    }
  }
  return purged;
}

/** Check if pairing is currently enabled (runtime toggle stored in config table) */
export function isPairingEnabled(): boolean {
  const db = getDatabase();
  const row = db.prepare(
    "SELECT value FROM config WHERE key = 'pairing_enabled'"
  ).get() as { value: string } | undefined;

  if (row) return row.value === '1';

  // Fall back to env var default
  return getConfig().PAIRING_ENABLED;
}

/** Set pairing enabled/disabled (persisted in config table) */
export function setPairingEnabled(enabled: boolean): void {
  const db = getDatabase();
  db.prepare(
    `INSERT INTO config (key, value) VALUES ('pairing_enabled', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(enabled ? '1' : '0');
}
