import { getDatabase } from '../database.js';

export interface Webhook {
  id: string;
  name: string;
  slug: string;
  action_type: string;
  action_payload: string | null;
  tier: string;
  secret: string | null;
  enabled: number;
  last_triggered_at: string | null;
  created_at: string;
}

export function createWebhook(webhook: {
  id: string;
  name: string;
  slug: string;
  action_type: string;
  action_payload?: string | null;
  tier: string;
  secret?: string | null;
}): void {
  const db = getDatabase();
  db.prepare(
    `INSERT INTO webhooks (id, name, slug, action_type, action_payload, tier, secret)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    webhook.id, webhook.name, webhook.slug,
    webhook.action_type, webhook.action_payload ?? null,
    webhook.tier, webhook.secret ?? null
  );
}

export function getWebhook(id: string): Webhook | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM webhooks WHERE id = ?').get(id) as unknown as Webhook | undefined;
}

export function getWebhookBySlug(slug: string): Webhook | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM webhooks WHERE slug = ? AND enabled = 1').get(slug) as unknown as Webhook | undefined;
}

export function listWebhooks(): Webhook[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM webhooks ORDER BY created_at DESC').all() as unknown as Webhook[];
}

export function deleteWebhook(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM webhooks WHERE id = ?').run(id);
  return result.changes > 0;
}

export function updateWebhookLastTriggered(id: string): void {
  const db = getDatabase();
  db.prepare("UPDATE webhooks SET last_triggered_at = datetime('now') WHERE id = ?").run(id);
}
