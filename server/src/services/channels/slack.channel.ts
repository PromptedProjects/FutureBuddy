import type { ChannelAdapter } from '../channel-manager.service.js';

export class SlackChannel implements ChannelAdapter {
  type = 'slack';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private app: any = null;
  private running = false;

  async start(config: Record<string, string>): Promise<void> {
    if (!config.bot_token || !config.signing_secret) {
      throw new Error('Slack bot_token and signing_secret are required');
    }

    try {
      const mod = await import('@slack/bolt' as string);
      const App = mod.App ?? mod.default?.App;
      this.app = new App({
        token: config.bot_token,
        signingSecret: config.signing_secret,
        socketMode: true,
        appToken: config.app_token,
      });

      this.app.message(async ({ say }: { message: unknown; say: (m: string) => Promise<void> }) => {
        await say('[FutureBox] Message received. Processing...');
      });

      await this.app.start();
      this.running = true;
    } catch (err) {
      throw new Error(`Failed to start Slack bot: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async stop(): Promise<void> {
    if (this.app && this.running) {
      await this.app.stop();
      this.running = false;
    }
  }

  async sendMessage(channelId: string, message: string): Promise<void> {
    if (!this.app || !this.running) throw new Error('Slack bot not running');
    await this.app.client.chat.postMessage({ channel: channelId, text: message });
  }

  isRunning(): boolean {
    return this.running;
  }
}
