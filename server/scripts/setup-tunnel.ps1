# FutureBox — Cloudflare Tunnel Setup
param(
    [string]$TunnelName = "futurebox",
    [int]$LocalPort = 3737
)

function cf { cmd /c "cloudflared $args 2>&1" }

# --- 1. Check cloudflared ---
$ver = cf version
if (-not $ver) {
    Write-Host "cloudflared not found — install with: npm install -g cloudflared" -ForegroundColor Red
    exit 1
}
Write-Host "[1/5] $ver" -ForegroundColor Green

# --- 2. Login ---
$certPath = Join-Path $env:USERPROFILE ".cloudflared\cert.pem"
if (-not (Test-Path $certPath)) {
    Write-Host "[2/5] Logging in — browser will open..." -ForegroundColor Yellow
    cmd /c "cloudflared tunnel login"
} else {
    Write-Host "[2/5] Already logged in." -ForegroundColor Green
}

# --- 3. Create tunnel ---
Write-Host "[3/5] Checking tunnels..." -ForegroundColor Yellow
$raw = cmd /c "cloudflared tunnel list --output json 2>nul"
$tunnelId = $null

if ($raw) {
    try {
        $tunnels = $raw | ConvertFrom-Json
        $match = $tunnels | Where-Object { $_.name -eq $TunnelName }
        if ($match) { $tunnelId = $match.id }
    } catch {}
}

if ($tunnelId) {
    Write-Host "[3/5] Tunnel exists (ID: $tunnelId)." -ForegroundColor Green
} else {
    Write-Host "[3/5] Creating tunnel '$TunnelName'..." -ForegroundColor Yellow
    cmd /c "cloudflared tunnel create $TunnelName"
    $raw = cmd /c "cloudflared tunnel list --output json 2>nul"
    $tunnels = $raw | ConvertFrom-Json
    $match = $tunnels | Where-Object { $_.name -eq $TunnelName }
    $tunnelId = $match.id
    Write-Host "[3/5] Created (ID: $tunnelId)." -ForegroundColor Green
}

# --- 4. Write config ---
$configDir = Join-Path $env:USERPROFILE ".cloudflared"
$configPath = Join-Path $configDir "config.yml"

@"
tunnel: $tunnelId
credentials-file: $configDir\$tunnelId.json

ingress:
  - service: http://localhost:$LocalPort
"@ | Set-Content $configPath -Encoding UTF8

Write-Host "[4/5] Config written to $configPath" -ForegroundColor Green

# --- 5. Start tunnel ---
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Local: http://localhost:$LocalPort" -ForegroundColor Cyan
Write-Host " Tunnel: $tunnelId" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[5/5] Starting tunnel... (Ctrl+C to stop)" -ForegroundColor Yellow
Write-Host ""

cmd /c "cloudflared tunnel run $TunnelName"
