import { execSync } from 'node:child_process';

/** Read current clipboard text content */
export function readClipboard(): string {
  try {
    const result = execSync('powershell -NoProfile -Command "Get-Clipboard"', {
      encoding: 'utf-8',
      timeout: 5000,
    });
    return result.trimEnd();
  } catch (err) {
    throw new Error('Failed to read clipboard: ' + (err instanceof Error ? err.message : String(err)));
  }
}

/** Write text to the clipboard */
export function writeClipboard(text: string): void {
  try {
    // Pipe text via stdin to avoid escaping issues
    execSync('powershell -NoProfile -Command "Set-Clipboard -Value $input"', {
      input: text,
      encoding: 'utf-8',
      timeout: 5000,
    });
  } catch (err) {
    throw new Error('Failed to write clipboard: ' + (err instanceof Error ? err.message : String(err)));
  }
}
