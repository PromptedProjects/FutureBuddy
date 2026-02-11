import si from 'systeminformation';

export interface NetworkInterface {
  iface: string;
  ip4: string;
  ip6: string;
  mac: string;
  type: string;
  speed: number | null;
  dhcp: boolean;
  operstate: string;
}

export interface WifiNetwork {
  ssid: string;
  bssid: string;
  channel: number;
  frequency: number;
  signal: number;
  security: string[];
}

export interface ActiveConnection {
  protocol: string;
  localAddress: string;
  localPort: number;
  peerAddress: string;
  peerPort: number;
  state: string;
  process: string;
}

/** Get network interfaces with details */
export async function getNetworkInterfaces(): Promise<NetworkInterface[]> {
  const ifaces = await si.networkInterfaces();
  const list = Array.isArray(ifaces) ? ifaces : [ifaces];
  return list.map((i) => ({
    iface: i.iface,
    ip4: i.ip4,
    ip6: i.ip6,
    mac: i.mac,
    type: i.type,
    speed: i.speed,
    dhcp: i.dhcp,
    operstate: i.operstate,
  }));
}

/** Scan for available WiFi networks */
export async function getWifiNetworks(): Promise<WifiNetwork[]> {
  const networks = await si.wifiNetworks();
  const list = Array.isArray(networks) ? networks : [networks];
  return list.map((n) => ({
    ssid: n.ssid,
    bssid: n.bssid,
    channel: n.channel,
    frequency: n.frequency,
    signal: n.signalLevel,
    security: n.security,
  }));
}

/** Get active network connections */
export async function getActiveConnections(): Promise<ActiveConnection[]> {
  const conns = await si.networkConnections();
  return conns.slice(0, 100).map((c) => ({
    protocol: c.protocol,
    localAddress: c.localAddress,
    localPort: Number(c.localPort),
    peerAddress: c.peerAddress,
    peerPort: Number(c.peerPort),
    state: c.state,
    process: c.process ?? '',
  }));
}

/** Get public IP address */
export async function getPublicIp(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json() as { ip: string };
    return data.ip;
  } catch {
    return 'unknown';
  }
}
