import type { FastifyInstance } from 'fastify';
import {
  getNetworkInterfaces,
  getWifiNetworks,
  getActiveConnections,
  getPublicIp,
} from '../services/network.service.js';

export async function networkRoutes(app: FastifyInstance): Promise<void> {
  /** Get network interfaces (green) */
  app.get('/network/interfaces', async () => {
    const interfaces = await getNetworkInterfaces();
    return { ok: true, data: { interfaces } };
  });

  /** Scan WiFi networks (green) */
  app.get('/network/wifi', async () => {
    const networks = await getWifiNetworks();
    return { ok: true, data: { networks } };
  });

  /** Get active connections (green) */
  app.get('/network/connections', async () => {
    const connections = await getActiveConnections();
    return { ok: true, data: { connections } };
  });

  /** Get public IP (green) */
  app.get('/network/public-ip', async () => {
    const ip = await getPublicIp();
    return { ok: true, data: { ip } };
  });
}
