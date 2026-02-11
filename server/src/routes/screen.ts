import type { FastifyInstance } from 'fastify';
import { listDisplays, captureScreen } from '../services/screen.service.js';

export async function screenRoutes(app: FastifyInstance): Promise<void> {
  /** List available displays (green) */
  app.get('/screen/displays', async () => {
    const displays = await listDisplays();
    return { ok: true, data: { displays } };
  });

  /** Capture screen screenshot (yellow) */
  app.get('/screen/capture', async (request) => {
    const { display } = request.query as { display?: string };
    const displayId = display ? parseInt(display, 10) : undefined;
    try {
      const image = captureScreen(displayId);
      return { ok: true, data: { image, format: 'png', encoding: 'base64' } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to capture screen' };
    }
  });
}
