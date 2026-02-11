import { execSync } from 'node:child_process';

/** Shutdown the system */
export function shutdown(delay = 0): void {
  execSync(`shutdown /s /t ${delay}`, { timeout: 5000 });
}

/** Restart the system */
export function restart(delay = 0): void {
  execSync(`shutdown /r /t ${delay}`, { timeout: 5000 });
}

/** Put the system to sleep */
export function sleep(): void {
  execSync('rundll32.exe powrprof.dll,SetSuspendState 0,1,0', { timeout: 5000 });
}

/** Lock the workstation */
export function lock(): void {
  execSync('rundll32.exe user32.dll,LockWorkStation', { timeout: 5000 });
}

/** Cancel a pending shutdown */
export function cancelShutdown(): void {
  execSync('shutdown /a', { timeout: 5000 });
}
