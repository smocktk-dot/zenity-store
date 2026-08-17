@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo Gerando identificador unico (HWID)...

for /f "tokens=2 delims==" %%a in ('wmic csproduct get uuid /value ^| find "="') do set "UUID=%%a"
for /f "tokens=2 delims==" %%a in ('wmic cpu get processorid /value ^| find "="') do set "CPU=%%a"

set "UUID=!UUID:~0,-1!"
set "CPU=!CPU:~0,-1!"
set "RAW=!CPU!:!UUID!"

powershell -NoProfile -Command "^$h = New-Object System.Security.Cryptography.SHA256Managed; ^$b = [Text.Encoding]::UTF8.GetBytes('!RAW!'); ^$r = ^$h.ComputeHash(^$b); [BitConverter]::ToString(^$r) -replace '-' | Out-File -FilePath '%TEMP%\hwid.txt' -NoNewline"

set /p "HWID=" <%TEMP%\hwid.txt

echo.
echo ===========================================
echo  SEU HWID (Other Store):
echo  %HWID%
echo ===========================================
echo.
echo Copie esse codigo e cole no painel Other Store.
echo.
start "" "https://vgsellers.lat/?hwid=%HWID%"

del "%TEMP%\hwid.txt" 2>nul

pause
