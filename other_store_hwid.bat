@echo off
chcp 65001 >nul
setlocal

set "SITE_URL=https://vgsellers.lat"

echo Abrindo site com login automatico pelo Discord...
start "" "!SITE_URL!"
