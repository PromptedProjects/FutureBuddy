param(
    [int]$Port = 58000,
    [string]$Protocol = "http"
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
$notifyIcon.Text = "FutureBox"
$notifyIcon.Visible = $true

# Create a simple icon (green circle)
$bitmap = New-Object System.Drawing.Bitmap(16, 16)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.FillEllipse([System.Drawing.Brushes]::LimeGreen, 2, 2, 12, 12)
$graphics.Dispose()
$notifyIcon.Icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())

# Context menu
$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

$statusItem = $contextMenu.Items.Add("FutureBox - Running")
$statusItem.Enabled = $false

$contextMenu.Items.Add("-") | Out-Null

$openItem = $contextMenu.Items.Add("Open Dashboard")
$openItem.Add_Click({
    Start-Process "${Protocol}://localhost:${Port}/status"
})

$contextMenu.Items.Add("-") | Out-Null

$exitItem = $contextMenu.Items.Add("Exit")
$exitItem.Add_Click({
    $notifyIcon.Visible = $false
    $notifyIcon.Dispose()
    [System.Windows.Forms.Application]::Exit()
})

$notifyIcon.ContextMenuStrip = $contextMenu

# Double-click opens status
$notifyIcon.Add_DoubleClick({
    Start-Process "${Protocol}://localhost:${Port}/status"
})

# Run message loop
[System.Windows.Forms.Application]::Run()
