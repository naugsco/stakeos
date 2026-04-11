$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$PidFile = Join-Path $ProjectDir ".run/dashboard.pid"

function Show-Message([string]$message) {
  Add-Type -AssemblyName PresentationFramework -ErrorAction SilentlyContinue | Out-Null
  [System.Windows.MessageBox]::Show($message, "StakeOS Dashboard") | Out-Null
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
    Get-Process -Id $pid -ErrorAction Stop | Out-Null
    Stop-Process -Id $pid -Force
  } catch {
  }
}

if (Test-Path $PidFile) {
  $pid = Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($pid) {
    Stop-ProcessIfRunning ([int]$pid)
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    Show-Message "StakeOS dashboard stopped."
    exit 0
  }
}

$processes = @(Get-StakeOsNextProcesses)
if ($processes.Count -gt 0) {
  $processes | ForEach-Object { Stop-ProcessIfRunning $_.ProcessId }
  Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
  Show-Message "Stopped StakeOS dashboard process(es)."
  exit 0
}

Show-Message "No running StakeOS dashboard process found."
