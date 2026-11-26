@echo off
title TrustFund AI Launcher
echo Starting TrustFund AI Multi-Tier Services...
powershell -ExecutionPolicy Bypass -File "%~dp0start-all.ps1"
pause
