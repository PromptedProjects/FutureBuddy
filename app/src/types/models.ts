// Mirrors server types exactly

export type ActionTier = 'red' | 'yellow' | 'green';
export type ActionStatus = 'pending' | 'approved' | 'denied' | 'expired';
export type MessageRole = 'user' | 'assistant' | 'system';
export type TrustDecision = 'auto_approve' | 'auto_deny' | 'ask';
export type Capability = 'language' | 'reasoning' | 'vision' | 'stt' | 'tts';

export interface Action {
  id: string;
  conversation_id: string | null;
  type: string;
  tier: ActionTier;
  title: string;
  description: string | null;
  payload: string | null;
  status: ActionStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  model: string | null;
  tokens_used: number | null;
  created_at: string;
  images?: string[]; // base64 for display
}

export interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrustRule {
  id: string;
  service: string;
  action: string;
  decision: TrustDecision;
  created_at: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  capabilities: Capability[];
  size?: string;
}

export interface ModelSlots {
  slots: Record<Capability, { provider: string; model: string } | null>;
}

export interface SystemStatus {
  version: string;
  uptime: number;
  status: 'running';
  cpu: {
    model: string;
    usage: number;
    cores: number;
    temperature: number | null;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    ip: string;
    hostname: string;
  };
  ai: {
    connected_clients: number;
  };
}

// --- Phase 1: Process ---

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  started: string;
  state: string;
  path: string;
  command: string;
}

// --- Phase 2: Browser ---

export interface TabInfo {
  id: string;
  url: string;
  title: string;
}

// --- Phase 3: Network ---

export interface NetworkInterface {
  iface: string;
  ip4: string;
  ip6: string;
  mac: string;
  type: string;
  speed: number | null;
  dhcp: boolean;
  operstate: string;
}

export interface WifiNetwork {
  ssid: string;
  bssid: string;
  channel: number;
  frequency: number;
  signal: number;
  security: string[];
}

// --- Phase 4: Scheduler + Webhooks ---

export interface ScheduledTask {
  id: string;
  name: string;
  cron: string;
  action_type: string;
  action_payload: string | null;
  tier: ActionTier;
  enabled: number;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}

export interface Webhook {
  id: string;
  name: string;
  slug: string;
  action_type: string;
  action_payload: string | null;
  tier: ActionTier;
  secret: string | null;
  enabled: number;
  last_triggered_at: string | null;
  created_at: string;
}

// --- Phase 5: Skills ---

export interface SkillAction {
  name: string;
  description: string;
  tier: ActionTier;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  actions: SkillAction[];
}

// --- Phase 7: Hotkeys ---

export interface HotkeyBinding {
  id: string;
  combo: string;
  action_type: string;
  action_payload: string | null;
  tier: ActionTier;
  enabled: number;
  created_at: string;
}
