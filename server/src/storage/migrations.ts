import type { DatabaseSync } from 'node:sqlite';
import type { Logger } from '../utils/logger.js';

interface Migration {
  version: number;
  description: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    description: 'Core tables: sessions, config, conversations, messages, actions, trust_rules',
    sql: `
      CREATE TABLE sessions (
        id            TEXT PRIMARY KEY,
        token_hash    TEXT NOT NULL UNIQUE,
        device_name   TEXT,
        created_at    TEXT NOT NULL DEFAULT (datetime('now')),
        last_seen_at  TEXT NOT NULL DEFAULT (datetime('now')),
        revoked       INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE config (
        key        TEXT PRIMARY KEY,
        value      TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE conversations (
        id         TEXT PRIMARY KEY,
        title      TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE messages (
        id              TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content         TEXT NOT NULL,
        model           TEXT,
        tokens_used     INTEGER,
        created_at      TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

      CREATE TABLE actions (
        id              TEXT PRIMARY KEY,
        conversation_id TEXT REFERENCES conversations(id),
        type            TEXT NOT NULL,
        tier            TEXT NOT NULL CHECK (tier IN ('red', 'yellow', 'green')),
        title           TEXT NOT NULL,
        description     TEXT,
        payload         TEXT,
        status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
        created_at      TEXT NOT NULL DEFAULT (datetime('now')),
        resolved_at     TEXT
      );
      CREATE INDEX idx_actions_status ON actions(status);

      CREATE TABLE trust_rules (
        id         TEXT PRIMARY KEY,
        service    TEXT NOT NULL,
        action     TEXT NOT NULL,
        decision   TEXT NOT NULL CHECK (decision IN ('auto_approve', 'auto_deny', 'ask')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(service, action)
      );
    `,
  },
  {
    version: 2,
    description: 'Scheduled tasks, webhooks, and hotkeys tables',
    sql: `
      CREATE TABLE scheduled_tasks (
        id             TEXT PRIMARY KEY,
        name           TEXT NOT NULL,
        cron           TEXT NOT NULL,
        action_type    TEXT NOT NULL,
        action_payload TEXT,
        tier           TEXT NOT NULL CHECK (tier IN ('red', 'yellow', 'green')),
        enabled        INTEGER NOT NULL DEFAULT 1,
        last_run_at    TEXT,
        next_run_at    TEXT,
        created_at     TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE webhooks (
        id                TEXT PRIMARY KEY,
        name              TEXT NOT NULL,
        slug              TEXT NOT NULL UNIQUE,
        action_type       TEXT NOT NULL,
        action_payload    TEXT,
        tier              TEXT NOT NULL CHECK (tier IN ('red', 'yellow', 'green')),
        secret            TEXT,
        enabled           INTEGER NOT NULL DEFAULT 1,
        last_triggered_at TEXT,
        created_at        TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE hotkeys (
        id         TEXT PRIMARY KEY,
        combo      TEXT NOT NULL UNIQUE,
        action_type TEXT NOT NULL,
        action_payload TEXT,
        tier       TEXT NOT NULL CHECK (tier IN ('red', 'yellow', 'green')),
        enabled    INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
];

export function runMigrations(db: DatabaseSync, logger: Logger): void {
  // Create migrations meta table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version     INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      applied_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const currentVersion = db.prepare(
    'SELECT COALESCE(MAX(version), 0) as v FROM _migrations'
  ).get() as { v: number };

  const current = currentVersion.v;

  const pending = migrations.filter((m) => m.version > current);

  if (pending.length === 0) {
    logger.debug(`Database schema up to date (v${current})`);
    return;
  }

  for (const migration of pending) {
    logger.info(`Running migration v${migration.version}: ${migration.description}`);
    db.exec(migration.sql);
    db.prepare(
      'INSERT INTO _migrations (version, description) VALUES (?, ?)'
    ).run(migration.version, migration.description);
  }

  logger.info(`Migrations complete — now at v${pending[pending.length - 1].version}`);
}
