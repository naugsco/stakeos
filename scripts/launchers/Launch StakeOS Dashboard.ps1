$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$Port = if ($env:PORT) { [int]$env:PORT } else { 3000 }
$RunDir = Join-Path $ProjectDir ".run"
$LogFile = Join-Path $RunDir "dashboard.log"
$ServerOutLog = Join-Path $RunDir "server.out.log"
$ServerErrLog = Join-Path $RunDir "server.err.log"
$PidFile = Join-Path $RunDir "dashboard.pid"
$LockFile = Join-Path $RunDir "launcher.lock"

New-Item -ItemType Directory -Force -Path $RunDir | Out-Null
Set-Location $ProjectDir

function Write-Log([string]$message) {
  $line = "[$(Get-Date -Format s)] $message"
  Write-Host $line
  Add-Content -Path $LogFile -Value $line
}

function Show-Message([string]$message) {
  Write-Log $message
  try {
    Add-Type -AssemblyName PresentationFramework -ErrorAction Stop
    [System.Windows.MessageBox]::Show($message, "StakeOS Dashboard") | Out-Null
  } catch {
    # No desktop/WPF available (Server Core, remote session). The console line
    # written by Write-Log is the message in that case.
  }
}

function Get-CommandPath([string]$name, [string[]]$fallbacks) {
  $cmd = Get-Command $name -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($cmd) {
    return $cmd.Source
  }

  foreach ($fallback in $fallbacks) {
    if ($fallback -and (Test-Path $fallback)) {
      return $fallback
    }
  }

  return $null
}

# Only ever matches a running server. A `next build` shares the same bin path, and
# killing one mid-flight corrupts .next and fails the launch that started it.
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
    $proc = Get-Process -Id $TargetPid -ErrorAction Stop
    Stop-Process -Id $proc.Id -Force
  } catch {
  }
}

# Probes the dedicated health route rather than /dashboard: rendering the dashboard
# reads the database and can outlast a short timeout on a cold server, which made
# the launcher declare a healthy server dead.
function Test-StakeOsServerHealthy([int]$TimeoutSec = 15) {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:$Port/api/health" -TimeoutSec $TimeoutSec
    if (-not $response.Content) {
      return $false
    }
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

# A false negative here is expensive: it kills a healthy server and rebuilds from
# scratch, costing minutes. One slow response must not be enough to trigger that.
function Test-StakeOsServerHealthyWithRetry {
  for ($attempt = 1; $attempt -le 3; $attempt++) {
    if (Test-StakeOsServerHealthy) {
      return $true
    }
    Start-Sleep -Seconds 2
  }
  return $false
}

# The build runs for minutes with no window of its own, so an impatient second
# double-click used to start a rival build that killed the first one.
function Test-LauncherAlreadyRunning {
  if (-not (Test-Path $LockFile)) {
    return $false
  }

  $lockPid = Get-Content $LockFile -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $lockPid) {
    return $false
  }

  try {
    $proc = Get-Process -Id ([int]$lockPid) -ErrorAction Stop
    return $proc.ProcessName -match '^(powershell|pwsh)$'
  } catch {
    return $false
  }
}

# npm output has to be captured without Start-Process: PowerShell refuses to send
# stdout and stderr of a started process to the same file. Running npm inline and
# merging 2>&1 into the pipeline keeps a single readable log for support.
function Invoke-Npm([string[]]$npmArgs) {
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    # ToString() rather than Out-String: stderr arrives as ErrorRecords, and the
    # default rendering buries the actual npm message under PowerShell stack noise.
    & $npmPath @npmArgs 2>&1 | ForEach-Object { $_.ToString() } | Add-Content -Path $LogFile
    return $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousPreference
  }
}

function Copy-ServerLogTail {
  foreach ($file in @($ServerOutLog, $ServerErrLog)) {
    if (-not (Test-Path $file)) {
      continue
    }
    try {
      $tail = Get-Content -Path $file -Tail 40 -ErrorAction Stop
      if ($tail) {
        Add-Content -Path $LogFile -Value "--- $(Split-Path -Leaf $file) (last 40 lines) ---"
        Add-Content -Path $LogFile -Value $tail
      }
    } catch {
      Add-Content -Path $LogFile -Value "--- could not read $file : $($_.Exception.Message) ---"
    }
  }
}

if (Test-LauncherAlreadyRunning) {
  Show-Message "StakeOS is already starting up in another window. It can take a few minutes on the first launch, and your browser opens automatically when the dashboard is ready."
  exit 0
}

Set-Content -Path $LockFile -Value $PID

try {
  $nodePath = Get-CommandPath "node.exe" @(
    "C:\Program Files\nodejs\node.exe",
    "$env:LOCALAPPDATA\Programs\nodejs\node.exe"
  )

  # Must resolve npm.cmd specifically. `Get-Command npm` prefers npm.ps1, which
  # Start-Process cannot launch as an executable.
  $npmPath = Get-CommandPath "npm.cmd" @(
    $(if ($nodePath) { Join-Path (Split-Path -Parent $nodePath) "npm.cmd" }),
    "C:\Program Files\nodejs\npm.cmd",
    "$env:LOCALAPPDATA\Programs\nodejs\npm.cmd",
    "$env:APPDATA\npm\npm.cmd"
  )

  if (-not $nodePath -or -not $npmPath) {
    Show-Message "Node.js is not installed. Install Node.js first to run StakeOS from source on Windows."
    exit 1
  }

  # node_modules alone is not proof of a finished install - an interrupted first run
  # leaves the folder behind without the packages the build needs.
  $nextBin = Join-Path $ProjectDir "node_modules\next\dist\bin\next"
  if (-not (Test-Path $nextBin)) {
    Write-Log "Installing dependencies (first run only - this can take several minutes)..."
    $installExit = Invoke-Npm @("install")
    if ($installExit -ne 0) {
      Show-Message "Installing dependencies failed (npm install exit code $installExit). Check .run\dashboard.log for details."
      exit 1
    }
  }

  $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($listener) {
    if (Test-StakeOsServerHealthyWithRetry) {
      Write-Log "StakeOS is already running. Opening the dashboard."
      Start-Process "http://localhost:$Port/dashboard"
      exit 0
    }

    $owning = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)" -ErrorAction SilentlyContinue
    if ($owning -and $owning.CommandLine -match [regex]::Escape($ProjectDir) -and $owning.CommandLine -match 'next[\\/]dist[\\/]bin[\\/]next') {
      Write-Log "Replacing an unhealthy StakeOS server on port $Port."
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

  Write-Log "Building StakeOS dashboard (this can take a few minutes)..."
  $buildExit = Invoke-Npm @("run", "build")
  if ($buildExit -ne 0) {
    Show-Message "Dashboard build failed (exit code $buildExit). Check .run\dashboard.log for details."
    exit 1
  }

  Write-Log "Starting StakeOS dashboard..."
  Remove-Item $ServerOutLog, $ServerErrLog -Force -ErrorAction SilentlyContinue
  $startProcess = Start-Process -FilePath $npmPath -ArgumentList "run", "start", "--", "--port", "$Port" -WorkingDirectory $ProjectDir -RedirectStandardOutput $ServerOutLog -RedirectStandardError $ServerErrLog -PassThru -WindowStyle Hidden

  for ($i = 0; $i -lt 90; $i++) {
    if (Test-StakeOsServerHealthy -TimeoutSec 3) {
      # $startProcess is the npm.cmd wrapper, not the server. Record the node process
      # actually serving the dashboard so the stop script can shut it down.
      $serverProcess = Get-StakeOsNextProcesses | Select-Object -First 1
      $serverPid = if ($serverProcess) { $serverProcess.ProcessId } else { $startProcess.Id }
      Set-Content -Path $PidFile -Value $serverPid
      Write-Log "Dashboard ready at http://localhost:$Port/dashboard (pid $serverPid)."
      Start-Process "http://localhost:$Port/dashboard"
      exit 0
    }

    if ($startProcess.HasExited) {
      Copy-ServerLogTail
      Show-Message "The dashboard server stopped right after starting. Check .run\dashboard.log for details."
      exit 1
    }

    Start-Sleep -Seconds 1
  }

  Copy-ServerLogTail
  Show-Message "Dashboard failed to start on port $Port. Check .run\dashboard.log for details."
  exit 1
} finally {
  Remove-Item $LockFile -Force -ErrorAction SilentlyContinue
}
