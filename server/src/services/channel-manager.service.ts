export interface ChannelAdapter {
  type: string;
  start(config: Record<string, string>): Promise<void>;
  stop(): Promise<void>;
  sendMessage(target: string, message: string): Promise<void>;
  isRunning(): boolean;
}

const channels = new Map<string, ChannelAdapter>();

/** Register a channel adapter */
export function registerChannel(adapter: ChannelAdapter): void {
  channels.set(adapter.type, adapter);
}

/** Start a channel */
export async function startChannel(type: string, config: Record<string, string>): Promise<boolean> {
  const adapter = channels.get(type);
  if (!adapter) return false;
  await adapter.start(config);
  return true;
}

/** Stop a channel */
export async function stopChannel(type: string): Promise<boolean> {
  const adapter = channels.get(type);
  if (!adapter) return false;
  await adapter.stop();
  return true;
}

/** List all channels with status */
export function listChannels(): { type: string; running: boolean }[] {
  return Array.from(channels.values()).map((ch) => ({
    type: ch.type,
    running: ch.isRunning(),
  }));
}

/** Send a message through a channel */
export async function sendChannelMessage(type: string, target: string, message: string): Promise<boolean> {
  const adapter = channels.get(type);
  if (!adapter || !adapter.isRunning()) return false;
  await adapter.sendMessage(target, message);
  return true;
}
