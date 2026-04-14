@echo off
setlocal
cd /d "%~dp0.."
call "C:\Program Files\nodejs\npm.cmd" run dev > ".codex-dev-live.out.log" 2> ".codex-dev-live.err.log"
