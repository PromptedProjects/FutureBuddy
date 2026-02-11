import type { ChannelAdapter } from '../channel-manager.service.js';

export class DiscordChannel implements ChannelAdapter {
  type = 'discord';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;
  private running = false;

  async start(config: Record<string, string>): Promise<void> {
    if (!config.bot_token) throw new Error('Discord bot_token is required');

    try {
      const mod = await import('discord.js' as string);
      const Client = mod.Client;
      const GatewayIntentBits = mod.GatewayIntentBits;
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
        ],
      });

      this.client.on('messageCreate', async (msg: { author: { bot: boolean }; reply: (m: string) => Promise<void> }) => {
        if (msg.author.bot) return;
        await msg.reply('[FutureBox] Message received. Processing...');
      });

      await this.client.login(config.bot_token);
      this.running = true;
    } catch (err) {
      throw new Error(`Failed to start Discord bot: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async stop(): Promise<void> {
    if (this.client && this.running) {
      this.client.destroy();
      this.running = false;
    }
  }

  async sendMessage(channelId: string, message: string): Promise<void> {
    if (!this.client || !this.running) throw new Error('Discord bot not running');
    const channel = await this.client.channels.fetch(channelId);
    if (channel && typeof channel.send === 'function') {
      await channel.send(message);
    }
  }

  isRunning(): boolean {
    return this.running;
  }
}
