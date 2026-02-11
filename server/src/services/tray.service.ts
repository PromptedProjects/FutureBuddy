import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';

let trayProcess: ChildProcess | null = null;

/** Start the system tray icon (PowerShell script) */
export function startTray(port: number, protocol: string): void {
  if (trayProcess) return;

  const scriptPath = join(import.meta.dirname, '..', '..', 'scripts', 'tray.ps1');

  try {
    trayProcess = spawn('powershell', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
      '-Port', String(port),
      '-Protocol', protocol,
    ], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });

    trayProcess.unref();
    trayProcess.on('exit', () => { trayProcess = null; });
  } catch {
    // Tray is non-critical
  }
}

/** Stop the system tray icon */
export function stopTray(): void {
  if (trayProcess) {
    trayProcess.kill();
    trayProcess = null;
  }
}

/** Check if tray is running */
export function isTrayRunning(): boolean {
  return trayProcess !== null;
}
