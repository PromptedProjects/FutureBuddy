import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync, unlinkSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

export interface DisplayInfo {
  id: number;
  name: string;
  primary: boolean;
}

/** List available displays */
export async function listDisplays(): Promise<DisplayInfo[]> {
  try {
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.Screen]::AllScreens | ForEach-Object {
        [PSCustomObject]@{
          DeviceName = $_.DeviceName
          Primary = $_.Primary
          Bounds = "$($_.Bounds.Width)x$($_.Bounds.Height)"
        }
      } | ConvertTo-Json -Compress
    `;
    const result = execSync(`powershell -NoProfile -Command "${script.replace(/\n/g, ' ')}"`, {
      encoding: 'utf-8',
      timeout: 10000,
    });
    const parsed = JSON.parse(result);
    const screens = Array.isArray(parsed) ? parsed : [parsed];
    return screens.map((s: { DeviceName: string; Primary: boolean }, i: number) => ({
      id: i,
      name: s.DeviceName,
      primary: s.Primary,
    }));
  } catch {
    return [{ id: 0, name: 'Primary', primary: true }];
  }
}

/** Capture screen as base64 PNG */
export function captureScreen(_displayId?: number): string {
  const tmpFile = join(tmpdir(), `fb-screen-${randomBytes(4).toString('hex')}.png`);
  try {
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      $screen = [System.Windows.Forms.Screen]::PrimaryScreen
      $bitmap = New-Object System.Drawing.Bitmap($screen.Bounds.Width, $screen.Bounds.Height)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $graphics.CopyFromScreen($screen.Bounds.Location, [System.Drawing.Point]::Empty, $screen.Bounds.Size)
      $bitmap.Save('${tmpFile.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
      $graphics.Dispose()
      $bitmap.Dispose()
    `;
    execSync(`powershell -NoProfile -Command "${script.replace(/\n/g, ' ')}"`, {
      timeout: 15000,
    });
    const buffer = readFileSync(tmpFile);
    return buffer.toString('base64');
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}
