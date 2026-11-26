@echo off
title TrustFund AI - Database Seed
echo Populating MongoDB with Demo Users, Campaigns, and OCR Documents...
node "%~dp0backend\scripts\seed.js"
pause
