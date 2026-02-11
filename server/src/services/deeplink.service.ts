import { execSync } from 'node:child_process';

const PROTOCOL = 'futurebox';

/** Register futurebox:// protocol in Windows registry */
export function registerProtocol(serverUrl: string): void {
  try {
    const exePath = process.execPath.replace(/\\/g, '\\\\');
    const script = `
      New-Item -Path "HKCU:\\Software\\Classes\\${PROTOCOL}" -Force | Out-Null
      Set-ItemProperty -Path "HKCU:\\Software\\Classes\\${PROTOCOL}" -Name "(Default)" -Value "URL:FutureBox Protocol"
      Set-ItemProperty -Path "HKCU:\\Software\\Classes\\${PROTOCOL}" -Name "URL Protocol" -Value ""
      New-Item -Path "HKCU:\\Software\\Classes\\${PROTOCOL}\\shell\\open\\command" -Force | Out-Null
      Set-ItemProperty -Path "HKCU:\\Software\\Classes\\${PROTOCOL}\\shell\\open\\command" -Name "(Default)" -Value '"${exePath}" "%1"'
    `;
    execSync(`powershell -NoProfile -Command "${script.replace(/\n/g, ' ')}"`, {
      timeout: 10000,
      stdio: 'ignore',
    });
  } catch {
    // Registry write may fail without admin — not critical
  }
}

/** Parse a futurebox:// deep link URL into an action */
export function parseDeepLink(url: string): { action: string; params: Record<string, string> } | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== `${PROTOCOL}:`) return null;

    const action = parsed.hostname + parsed.pathname.replace(/^\//, '');
    const params: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return { action, params };
  } catch {
    return null;
  }
}
