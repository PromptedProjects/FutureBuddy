import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { listCameras, capturePhoto, captureVideo } from '../services/camera.service.js';

const videoBody = z.object({
  device_id: z.string().optional(),
  duration: z.number().min(1).max(30).optional(),
});

export async function cameraRoutes(app: FastifyInstance): Promise<void> {
  /** List camera devices (green) */
  app.get('/camera/devices', async () => {
    try {
      const devices = listCameras();
      return { ok: true, data: { devices } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to list cameras' };
    }
  });

  /** Capture photo (yellow) */
  app.post('/camera/photo', async (request) => {
    const { device_id } = (request.body ?? {}) as { device_id?: string };
    try {
      const image = capturePhoto(device_id);
      return { ok: true, data: { image, format: 'png', encoding: 'base64' } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to capture photo' };
    }
  });

  /** Capture video (red) */
  app.post('/camera/video', async (request, reply) => {
    const body = videoBody.safeParse(request.body);
    const deviceId = body.success ? body.data.device_id : undefined;
    const duration = body.success ? body.data.duration ?? 5 : 5;
    try {
      const video = captureVideo(deviceId, duration);
      return { ok: true, data: { video, format: 'mp4', encoding: 'base64', duration } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to capture video' };
    }
  });
}
