$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$PidFile = Join-Path $ProjectDir ".run/dashboard.pid"

function Show-Message([string]$message) {
  Write-Host $message
  try {
    Add-Type -AssemblyName PresentationFramework -ErrorAction Stop
    [System.Windows.MessageBox]::Show($message, "StakeOS Dashboard") | Out-Null
  } catch {
    # No desktop/WPF available (Server Core, remote session). The console line above
    # is the message in that case.
  }
}

function Get-StakeOsNextProcesses {
  Get-CimInstance Win32_Process |
    Where-Object {
      $_.Name -match '^node(.exe)?$' -and
      $_.CommandLine -match 'next[\\/]dist[\\/]bin[\\/]next"?\s+(start|dev)\b' -and
      $_.CommandLine -match [regex]::Escape($ProjectDir)
    }
}

function Stop-ProcessIfRunning([int]$TargetPid) {
  try {
    Get-Process -Id $TargetPid -ErrorAction Stop | Out-Null
    Stop-Process -Id $TargetPid -Force
    return $true
  } catch {
    return $false
  }
}

$stopped = 0

if (Test-Path $PidFile) {
  $storedPid = Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($storedPid) {
    try {
      if (Stop-ProcessIfRunning ([int]$storedPid)) {
        $stopped++
      }
    } catch {
      # A corrupt pid file should not stop the sweep below from cleaning up.
    }
  }
  Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

# Always sweep afterwards: the recorded pid can be stale, and a server started
# outside the launcher never had one recorded at all.
foreach ($process in @(Get-StakeOsNextProcesses)) {
  if (Stop-ProcessIfRunning $process.ProcessId) {
    $stopped++
  }
}

if ($stopped -gt 0) {
  Show-Message "StakeOS dashboard stopped."
  exit 0
}

Show-Message "No running StakeOS dashboard process found."
