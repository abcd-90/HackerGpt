@echo off
title HackerGPT Server & Browser Launcher
color 0a
echo =======================================================
echo          Starting HackerGPT AI Server...
echo =======================================================
echo.
echo Launching browser at http://localhost:8080 ...
start "" "http://localhost:8080"
echo Server is running. Keep this window open while using HackerGPT.
echo.
node server.js
pause
