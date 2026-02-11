import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync, unlinkSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

export interface CameraDevice {
  id: string;
  name: string;
}

/** List available cameras using ffmpeg */
export function listCameras(): CameraDevice[] {
  try {
    const result = execSync(
      'ffmpeg -list_devices true -f dshow -i dummy 2>&1',
      { encoding: 'utf-8', timeout: 10000 }
    );
    const cameras: CameraDevice[] = [];
    const lines = result.split('\n');
    let idx = 0;
    for (const line of lines) {
      const match = line.match(/"([^"]+)"\s*\(video\)/i);
      if (match) {
        cameras.push({ id: String(idx), name: match[1] });
        idx++;
      }
    }
    return cameras;
  } catch (err) {
    // ffmpeg may output to stderr even on success
    const output = err instanceof Error ? (err as Error & { stderr?: string }).stderr ?? '' : '';
    const cameras: CameraDevice[] = [];
    const lines = output.split('\n');
    let idx = 0;
    for (const line of lines) {
      const match = line.match(/"([^"]+)"\s*\(video\)/i);
      if (match) {
        cameras.push({ id: String(idx), name: match[1] });
        idx++;
      }
    }
    return cameras;
  }
}

/** Capture a photo from camera as base64 PNG */
export function capturePhoto(deviceId?: string): string {
  const tmpFile = join(tmpdir(), `fb-cam-${randomBytes(4).toString('hex')}.png`);
  const device = deviceId ?? '0';

  try {
    // Try DirectShow on Windows
    execSync(
      `ffmpeg -y -f dshow -i video="${device}" -frames:v 1 "${tmpFile}" 2>&1`,
      { timeout: 15000, encoding: 'utf-8' }
    );

    if (!existsSync(tmpFile)) {
      throw new Error('Capture failed — no output file');
    }

    const buffer = readFileSync(tmpFile);
    return buffer.toString('base64');
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

/** Capture video from camera as base64 (short clip) */
export function captureVideo(deviceId: string | undefined, duration: number): string {
  const tmpFile = join(tmpdir(), `fb-vid-${randomBytes(4).toString('hex')}.mp4`);
  const device = deviceId ?? '0';
  const dur = Math.min(duration, 30); // Max 30 seconds

  try {
    execSync(
      `ffmpeg -y -f dshow -i video="${device}" -t ${dur} "${tmpFile}" 2>&1`,
      { timeout: (dur + 10) * 1000, encoding: 'utf-8' }
    );

    if (!existsSync(tmpFile)) {
      throw new Error('Video capture failed — no output file');
    }

    const buffer = readFileSync(tmpFile);
    return buffer.toString('base64');
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}
