param(
    [int]$Port = 58000
)

# Simple hotkey listener that polls for registered hotkeys
# and sends HTTP requests when triggered.
# In a full implementation, this would use RegisterHotKey Win32 API.

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class HotKeyHelper {
    [DllImport("user32.dll")]
    public static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);
    [DllImport("user32.dll")]
    public static extern bool UnregisterHotKey(IntPtr hWnd, int id);
}
"@

$baseUrl = "http://localhost:${Port}"

# Keep alive - periodically check for new hotkey bindings
while ($true) {
    try {
        $response = Invoke-RestMethod -Uri "${baseUrl}/status" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.ok) {
            # Server is running
        }
    }
    catch {
        # Server not reachable, wait and retry
    }
    Start-Sleep -Seconds 30
}
