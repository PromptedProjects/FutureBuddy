import type {
  Action,
  Conversation,
  Message,
  ModelInfo,
  ModelSlots,
  SystemStatus,
  TrustRule,
  TrustDecision,
  ProcessInfo,
  TabInfo,
  NetworkInterface,
  WifiNetwork,
  ScheduledTask,
  Webhook,
  Skill,
  HotkeyBinding,
} from './models';

// Standard response wrappers
export interface ApiOk<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
}

export type ApiResponse<T> = ApiOk<T> | ApiError;

// Endpoint response data shapes

export interface PairCreateData {
  token: string;
  expires_at: string;
}

export interface PairData {
  session_token: string;
}

export interface MeData {
  session_id: string;
}

export interface StatusData extends SystemStatus {}

export interface ModelsData {
  models: ModelInfo[];
}

export interface ModelSlotsData extends ModelSlots {}

export interface ChatData {
  conversation_id: string;
  message_id: string;
  content: string;
  model?: string;
}

export interface ConversationsData {
  conversations: Conversation[];
}

export interface ConversationMessagesData {
  conversation: Conversation;
  messages: Message[];
  total: number;
}

export interface PendingActionsData {
  actions: Action[];
}

export interface ActionData {
  action: Action;
}

export interface SubmitActionData {
  decision: 'auto_approved' | 'auto_denied' | 'pending';
  action: Action;
}

export interface TrustRulesData {
  rules: TrustRule[];
}

export interface TrustRuleCreateData {
  id: string;
}

export interface ConfigData extends Record<string, string> {}

export interface ConfigValueData {
  key: string;
  value: string;
}

// Request bodies
export interface PairRequest {
  token: string;
  device_name?: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface TrustRuleRequest {
  service: string;
  action: string;
  decision: TrustDecision;
}

export interface ConfigSetRequest {
  key: string;
  value: string;
}

// --- Files ---

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: string;
}

export interface FilesListData {
  path: string;
  entries: FileEntry[];
}

export interface FileReadData {
  path: string;
  content: string;
}

export interface FileWriteData {
  path: string;
}

export interface FileMoveData {
  src: string;
  dest: string;
}

export interface FileCopyData {
  src: string;
  dest: string;
}

// --- Clipboard ---

export interface ClipboardData {
  text: string;
}

// --- Processes ---

export interface ProcessListData {
  processes: ProcessInfo[];
}

export interface ProcessLaunchData {
  pid: number;
  command: string;
}

// --- Screen ---

export interface ScreenCaptureData {
  image: string;
  format: string;
  encoding: string;
}

export interface DisplayListData {
  displays: { id: number; name: string; primary: boolean }[];
}

// --- Browser ---

export interface BrowserTabsData {
  tabs: TabInfo[];
}

// --- Power ---

export interface PowerActionData {
  action: string;
  delay?: number;
}

// --- Audio ---

export interface VolumeData {
  level: number;
}

// --- Network ---

export interface NetworkInterfacesData {
  interfaces: NetworkInterface[];
}

export interface WifiNetworksData {
  networks: WifiNetwork[];
}

export interface PublicIpData {
  ip: string;
}

// --- Scheduler ---

export interface ScheduledTasksData {
  tasks: ScheduledTask[];
}

// --- Webhooks ---

export interface WebhooksData {
  webhooks: Webhook[];
}

// --- Skills ---

export interface SkillsData {
  skills: Skill[];
}

export interface ToolDefinitionsData {
  tools: unknown[];
}

// --- Hotkeys ---

export interface HotkeysData {
  hotkeys: HotkeyBinding[];
}

// --- Channels ---

export interface ChannelsData {
  channels: { type: string; running: boolean }[];
}
