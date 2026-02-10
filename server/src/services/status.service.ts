import si from 'systeminformation';
import { wsManager } from '../ws/ws-manager.js';

export interface SystemStatus {
  version: string;
  uptime: number;
  status: 'running';
  cpu: { model: string; usage: number; cores: number; temperature: number | null };
  memory: { total: number; used: number; free: number; usage: number };
  disk: { total: number; used: number; free: number; usage: number };
  network: { ip: string; hostname: string };
  ai: { connected_clients: number };
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const [cpu, cpuLoad, cpuTemp, mem, disk, net, osInfo] = await Promise.all([
    si.cpu(),
    si.currentLoad(),
    si.cpuTemperature(),
    si.mem(),
    si.fsSize(),
    si.networkInterfaces(),
    si.osInfo(),
  ]);

  const primaryDisk = Array.isArray(disk) ? disk[0] : disk;
  const interfaces = Array.isArray(net) ? net : [net];
  const activeNet = interfaces.find((n) => n.ip4 && n.ip4 !== '127.0.0.1') ?? interfaces[0];

  return {
    version: '0.1.0',
    uptime: process.uptime(),
    status: 'running',
    cpu: {
      model: cpu.brand,
      usage: Math.round(cpuLoad.currentLoad * 10) / 10,
      cores: cpu.cores,
      temperature: cpuTemp.main ?? null,
    },
    memory: {
      total: mem.total,
      used: mem.used,
      free: mem.free,
      usage: Math.round((mem.used / mem.total) * 1000) / 10,
    },
    disk: {
      total: primaryDisk?.size ?? 0,
      used: primaryDisk?.used ?? 0,
      free: (primaryDisk?.size ?? 0) - (primaryDisk?.used ?? 0),
      usage: primaryDisk?.use ?? 0,
    },
    network: {
      ip: activeNet?.ip4 ?? 'unknown',
      hostname: osInfo.hostname,
    },
    ai: {
      connected_clients: wsManager.getConnectedCount(),
    },
  };
}
