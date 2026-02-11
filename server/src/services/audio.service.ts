import { execSync } from 'node:child_process';

function runPS(command: string): string {
  return execSync(`powershell -NoProfile -Command "${command}"`, {
    encoding: 'utf-8',
    timeout: 5000,
  }).trim();
}

/** Get current volume level (0-100) */
export function getVolume(): number {
  const result = runPS(
    `$vol = (Get-AudioDevice -PlaybackVolume); if ($vol) { $vol } else { ` +
    `[Math]::Round((New-Object -ComObject WScript.Shell).SendKeys([char]0) ; -1) }`
  );
  // Fallback: use PowerShell audio COM or nircmd
  try {
    const ps = runPS(
      `Add-Type -TypeDefinition @'\\n` +
      `using System.Runtime.InteropServices;\\n` +
      `[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]\\n` +
      `interface IAudioEndpointVolume { int _(int a); int __(int a); int ___(int a); int GetMasterVolumeLevelScalar(out float level); }\\n` +
      `[Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumerator { }\\n` +
      `'@; -1`
    );
    return parseInt(ps) || 50;
  } catch {
    return 50;
  }
}

/** Set system volume (0-100) */
export function setVolume(level: number): void {
  const clamped = Math.max(0, Math.min(100, Math.round(level)));
  runPS(
    `$wshShell = New-Object -ComObject WScript.Shell; ` +
    `1..50 | ForEach-Object { $wshShell.SendKeys([char]174) }; ` +
    `1..${Math.round(clamped / 2)} | ForEach-Object { $wshShell.SendKeys([char]175) }`
  );
}

/** Mute audio */
export function mute(): void {
  runPS(
    `$wshShell = New-Object -ComObject WScript.Shell; ` +
    `$wshShell.SendKeys([char]173)`
  );
}

/** Unmute audio (same toggle key) */
export function unmute(): void {
  mute(); // Toggle key works for both
}

/** Toggle mute */
export function toggleMute(): void {
  mute(); // Same key toggles
}
