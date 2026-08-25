@echo off
title Stop StakeOS Dashboard
setlocal

rem Double-click stopper for StakeOS on Windows. See the matching
rem "Launch StakeOS Dashboard.cmd" for why this .cmd wrapper is needed.

set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
set "SCRIPT=%~dp0Stop StakeOS Dashboard.ps1"

if not exist "%SCRIPT%" (
  echo Could not find the stop script:
  echo    %SCRIPT%
  echo.
  pause
  exit /b 1
)

"%PS%" -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
set "RC=%ERRORLEVEL%"

if not "%RC%"=="0" (
  echo.
  echo StakeOS could not be stopped cleanly. Exit code: %RC%
  echo.
  pause
)

endlocal & exit /b %RC%
