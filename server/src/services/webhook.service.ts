import { nanoid } from 'nanoid';
import {
  createWebhook as dbCreate,
  getWebhookBySlug,
  listWebhooks as dbList,
  deleteWebhook as dbDelete,
  updateWebhookLastTriggered,
  type Webhook,
} from '../storage/repositories/webhook.repository.js';

export interface CreateWebhookInput {
  name: string;
  slug: string;
  action_type: string;
  action_payload?: unknown;
  tier: string;
  secret?: string;
}

export interface WebhookTriggerResult {
  webhook_id: string;
  action_type: string;
  triggered: boolean;
}

/** Create a new webhook */
export function createWebhook(input: CreateWebhookInput): Webhook {
  const id = nanoid();
  dbCreate({
    id,
    name: input.name,
    slug: input.slug,
    action_type: input.action_type,
    action_payload: input.action_payload ? JSON.stringify(input.action_payload) : null,
    tier: input.tier,
    secret: input.secret ?? null,
  });
  // Retrieve and return the created webhook
  const webhooks = dbList();
  return webhooks.find((w) => w.id === id)!;
}

/** List all webhooks */
export function listWebhooks(): Webhook[] {
  return dbList();
}

/** Delete a webhook */
export function deleteWebhookById(id: string): boolean {
  return dbDelete(id);
}

/** Trigger a webhook by slug */
export function triggerWebhook(
  slug: string,
  _body: unknown,
  _headers: Record<string, string>,
): WebhookTriggerResult | null {
  const webhook = getWebhookBySlug(slug);
  if (!webhook) return null;

  updateWebhookLastTriggered(webhook.id);

  // In full implementation, this would submit an action through the action system
  return {
    webhook_id: webhook.id,
    action_type: webhook.action_type,
    triggered: true,
  };
}
