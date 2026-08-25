@echo off
title StakeOS Dashboard
setlocal

rem Double-click launcher for StakeOS on Windows.
rem
rem This wrapper exists because .ps1 files are not reliably double-clickable:
rem the default execution policy is Restricted, and .ps1 is often associated
rem with a Store app handler rather than "Run with PowerShell". A .cmd file is
rem always run by the command processor, and passing -ExecutionPolicy Bypass
rem here applies to this one launch only - it changes no system setting.

set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
set "SCRIPT=%~dp0Launch StakeOS Dashboard.ps1"
set "LOG=%~dp0..\..\.run\dashboard.log"

if not exist "%PS%" (
  echo Windows PowerShell was not found at:
  echo    %PS%
  echo.
  pause
  exit /b 1
)

if not exist "%SCRIPT%" (
  echo Could not find the launcher script:
  echo    %SCRIPT%
  echo.
  echo Make sure this .cmd file stays in the scripts\launchers folder.
  echo.
  pause
  exit /b 1
)

echo Starting StakeOS...
echo.
echo The first launch can take several minutes while it builds.
echo Leave this window open - your browser opens automatically when ready.
echo.

"%PS%" -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
set "RC=%ERRORLEVEL%"

if not "%RC%"=="0" (
  echo.
  echo ---------------------------------------------------------------
  echo  StakeOS did not start. Exit code: %RC%
  echo.
  echo  The full log is here:
  echo    %LOG%
  echo ---------------------------------------------------------------
  echo.
  pause
)

endlocal & exit /b %RC%
