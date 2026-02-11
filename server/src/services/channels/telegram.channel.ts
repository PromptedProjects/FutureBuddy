import type { ChannelAdapter } from '../channel-manager.service.js';

export class TelegramChannel implements ChannelAdapter {
  type = 'telegram';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private bot: any = null;
  private running = false;

  async start(config: Record<string, string>): Promise<void> {
    if (!config.bot_token) throw new Error('Telegram bot_token is required');

    try {
      const mod = await import('telegraf' as string);
      const Telegraf = mod.Telegraf ?? mod.default?.Telegraf ?? mod.default;
      this.bot = new Telegraf(config.bot_token);

      this.bot.on('text', async (ctx: { reply: (msg: string) => Promise<void> }) => {
        await ctx.reply('[FutureBox] Message received. Processing...');
      });

      await this.bot.launch();
      this.running = true;
    } catch (err) {
      throw new Error(`Failed to start Telegram bot: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async stop(): Promise<void> {
    if (this.bot && this.running) {
      this.bot.stop('manual');
      this.running = false;
    }
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    if (!this.bot || !this.running) throw new Error('Telegram bot not running');
    await this.bot.telegram.sendMessage(chatId, message);
  }

  isRunning(): boolean {
    return this.running;
  }
}
