$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$Port = if ($env:PORT) { [int]$env:PORT } else { 3000 }
$RunDir = Join-Path $ProjectDir ".run"
$LogFile = Join-Path $RunDir "dashboard.log"
$PidFile = Join-Path $RunDir "dashboard.pid"

New-Item -ItemType Directory -Force -Path $RunDir | Out-Null
Set-Location $ProjectDir

function Show-Message([string]$message) {
  Add-Type -AssemblyName PresentationFramework -ErrorAction SilentlyContinue | Out-Null
  [System.Windows.MessageBox]::Show($message, "StakeOS Dashboard") | Out-Null
}

function Get-CommandPath([string]$name, [string[]]$fallbacks) {
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  foreach ($fallback in $fallbacks) {
    if (Test-Path $fallback) {
      return $fallback
    }
  }

  return $null
}

function Get-StakeOsNextProcesses {
  Get-CimInstance Win32_Process |
    Where-Object {
      $_.Name -match '^node(.exe)?$' -and
      $_.CommandLine -match 'next[\\/]dist[\\/]bin[\\/]next' -and
      $_.CommandLine -match [regex]::Escape($ProjectDir)
    }
}

function Stop-ProcessIfRunning([int]$pid) {
  try {
    $proc = Get-Process -Id $pid -ErrorAction Stop
    Stop-Process -Id $proc.Id -Force
  } catch {
  }
}

function Test-StakeOsServerHealthy {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:$Port/dashboard" -TimeoutSec 5
    if (-not $response.Content) {
      return $false
    }
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

$nodePath = Get-CommandPath "node" @(
  "C:\Program Files\nodejs\node.exe",
  "$env:LOCALAPPDATA\Programs\nodejs\node.exe"
)
$npmPath = Get-CommandPath "npm" @(
  "C:\Program Files\nodejs\npm.cmd",
  "$env:LOCALAPPDATA\Programs\nodejs\npm.cmd"
)

if (-not $nodePath -or -not $npmPath) {
  Show-Message "Node.js is not installed. Install Node.js first to run StakeOS from source on Windows."
  exit 1
}

if (-not (Test-Path (Join-Path $ProjectDir "node_modules"))) {
  & $npmPath install
}

$listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
  if (Test-StakeOsServerHealthy) {
    Start-Process "http://localhost:$Port/dashboard"
    exit 0
  }

  $owning = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)" -ErrorAction SilentlyContinue
  if ($owning -and $owning.CommandLine -match [regex]::Escape($ProjectDir) -and $owning.CommandLine -match 'next[\\/]dist[\\/]bin[\\/]next') {
    Stop-ProcessIfRunning $listener.OwningProcess
    Start-Sleep -Seconds 1
    if (Test-Path $PidFile) {
      Remove-Item $PidFile -Force
    }
  } else {
    Show-Message "Port $Port is already in use by another app. Close it or set PORT before launching StakeOS."
    exit 1
  }
}

Get-StakeOsNextProcesses | ForEach-Object {
  Stop-ProcessIfRunning $_.ProcessId
}

Remove-Item -Recurse -Force (Join-Path $ProjectDir ".next") -ErrorAction SilentlyContinue

Add-Content -Path $LogFile -Value "[$(Get-Date -Format s)] Building StakeOS dashboard..."
$build = Start-Process -FilePath $npmPath -ArgumentList "run", "build" -WorkingDirectory $ProjectDir -RedirectStandardOutput $LogFile -RedirectStandardError $LogFile -PassThru -Wait -NoNewWindow
if ($build.ExitCode -ne 0) {
  Show-Message "Dashboard build failed. Check .run/dashboard.log for details."
  exit 1
}

Add-Content -Path $LogFile -Value "[$(Get-Date -Format s)] Starting StakeOS dashboard..."
$startProcess = Start-Process -FilePath $npmPath -ArgumentList "run", "start", "--", "--port", "$Port" -WorkingDirectory $ProjectDir -RedirectStandardOutput $LogFile -RedirectStandardError $LogFile -PassThru -WindowStyle Hidden

for ($i = 0; $i -lt 60; $i++) {
  if (Test-StakeOsServerHealthy) {
    Set-Content -Path $PidFile -Value $startProcess.Id
    Start-Process "http://localhost:$Port/dashboard"
    exit 0
  }
  Start-Sleep -Seconds 1
}

Show-Message "Dashboard failed to start on port $Port. Check .run/dashboard.log for details."
exit 1
