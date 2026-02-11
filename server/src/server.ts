import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import type { Config } from './config.js';
import type { Logger } from './utils/logger.js';
import { pairRoutes } from './routes/pair.js';
import { modelRoutes } from './routes/models.js';
import { chatRoutes } from './routes/chat.js';
import { historyRoutes } from './routes/history.js';
import { wsRoutes } from './routes/ws.js';
import { actionRoutes } from './routes/actions.js';
import { configRoutes } from './routes/config.js';
import { transcribeRoutes } from './routes/transcribe.js';
import { ttsRoutes } from './routes/tts.js';
import { filesRoutes } from './routes/files.js';
import { clipboardRoutes } from './routes/clipboard.js';
import { processRoutes } from './routes/process.js';
import { screenRoutes } from './routes/screen.js';
import { browserRoutes } from './routes/browser.js';
import { powerRoutes } from './routes/power.js';
import { audioRoutes } from './routes/audio.js';
import { networkRoutes } from './routes/network.js';
import { schedulerRoutes } from './routes/scheduler.js';
import { webhookRoutes, webhookIncomingRoutes } from './routes/webhook.js';
import { notificationRoutes } from './routes/notification.js';
import { skillsRoutes } from './routes/skills.js';
import { cameraRoutes } from './routes/camera.js';
import { channelRoutes } from './routes/channels.js';
import { hotkeyRoutes } from './routes/hotkeys.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error-handler.middleware.js';
import { getSystemStatus } from './services/status.service.js';

export interface ServerOptions {
  https?: { key: string; cert: string };
}

export async function buildServer(config: Config, logger: Logger, opts?: ServerOptions) {
  const fastifyOpts: Record<string, unknown> = {
    loggerInstance: logger,
    trustProxy: true,
  };

  if (opts?.https?.key && opts?.https?.cert) {
    fastifyOpts.https = { key: opts.https.key, cert: opts.https.cert };
  }

  const app = Fastify(fastifyOpts);

  // Global error handler
  app.setErrorHandler(errorHandler);

  await app.register(cors, { origin: true });
  await app.register(websocket);

  // Rate limiting
  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
  });

  // --- Public routes (no auth) ---

  // Health / status route — real system stats
  app.get('/status', async () => ({
    ok: true,
    data: await getSystemStatus(),
  }));

  // Pairing routes
  await app.register(pairRoutes);

  // WebSocket (auth handled inside via query param)
  await app.register(wsRoutes);

  // Webhook incoming route (public — no auth required)
  await app.register(webhookIncomingRoutes);

  // --- Protected routes (require auth) ---
  app.register(async (protectedScope) => {
    protectedScope.addHook('preHandler', requireAuth);

    // Authenticated health check (verifies token works)
    protectedScope.get('/me', async (request) => ({
      ok: true,
      data: { session_id: request.sessionId },
    }));

    // Model routes
    await protectedScope.register(modelRoutes);

    // Chat routes
    await protectedScope.register(chatRoutes);

    // History routes
    await protectedScope.register(historyRoutes);

    // Action + trust rule routes
    await protectedScope.register(actionRoutes);

    // Config routes
    await protectedScope.register(configRoutes);

    // Transcription routes
    await protectedScope.register(transcribeRoutes);

    // TTS routes
    await protectedScope.register(ttsRoutes);

    // Files routes (Phase 1: now with CRUD)
    await protectedScope.register(filesRoutes);

    // Clipboard routes (Phase 1)
    await protectedScope.register(clipboardRoutes);

    // Process management routes (Phase 1)
    await protectedScope.register(processRoutes);

    // Screen capture routes (Phase 2)
    await protectedScope.register(screenRoutes);

    // Browser control routes (Phase 2)
    await protectedScope.register(browserRoutes);

    // Power management routes (Phase 3)
    await protectedScope.register(powerRoutes);

    // Audio control routes (Phase 3)
    await protectedScope.register(audioRoutes);

    // Network info routes (Phase 3)
    await protectedScope.register(networkRoutes);

    // Scheduler routes (Phase 4)
    await protectedScope.register(schedulerRoutes);

    // Webhook management routes (Phase 4)
    await protectedScope.register(webhookRoutes);

    // Notification routes (Phase 5)
    await protectedScope.register(notificationRoutes);

    // Skills routes (Phase 5)
    await protectedScope.register(skillsRoutes);

    // Camera routes (Phase 6)
    await protectedScope.register(cameraRoutes);

    // Channel routes (Phase 6)
    await protectedScope.register(channelRoutes);

    // Hotkey routes (Phase 7)
    await protectedScope.register(hotkeyRoutes);
  });

  return app;
}
