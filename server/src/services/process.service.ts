import { spawn } from 'node:child_process';
import si from 'systeminformation';

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  started: string;
  state: string;
  path: string;
  command: string;
}

export interface LaunchResult {
  pid: number;
  command: string;
}

/** List running processes with CPU/memory info */
export async function listProcesses(): Promise<ProcessInfo[]> {
  const procs = await si.processes();
  return procs.list.slice(0, 200).map((p) => ({
    pid: p.pid,
    name: p.name,
    cpu: p.cpu,
    memory: p.mem,
    started: p.started,
    state: p.state,
    path: p.path,
    command: p.command,
  }));
}

/** Get info about a specific process by PID */
export async function getProcessInfo(pid: number): Promise<ProcessInfo | null> {
  const procs = await si.processes();
  const p = procs.list.find((proc) => proc.pid === pid);
  if (!p) return null;
  return {
    pid: p.pid,
    name: p.name,
    cpu: p.cpu,
    memory: p.mem,
    started: p.started,
    state: p.state,
    path: p.path,
    command: p.command,
  };
}

/** Kill a process by PID */
export function killProcess(pid: number, force = false): boolean {
  try {
    process.kill(pid, force ? 'SIGKILL' : 'SIGTERM');
    return true;
  } catch {
    return false;
  }
}

/** Launch an application/command */
export function launchApp(command: string, args: string[] = [], cwd?: string): LaunchResult {
  const child = spawn(command, args, {
    cwd: cwd || undefined,
    detached: true,
    stdio: 'ignore',
    shell: true,
  });

  child.unref();

  if (!child.pid) {
    throw new Error(`Failed to launch: ${command}`);
  }

  return { pid: child.pid, command: `${command} ${args.join(' ')}`.trim() };
}
