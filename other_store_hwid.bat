@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

set "API_URL=https://vgsellers.lat"

echo Gerando identificador unico (HWID) pela API...

powershell -NoProfile -Command "try { ^$r = Invoke-RestMethod -Uri '!API_URL!/api/reseller/v1/other-store/hwid' -Method POST; ^$r.hwid | Out-File -FilePath '%TEMP%\hwid.txt' -NoNewline } catch { 'erro' | Out-File -FilePath '%TEMP%\hwid.txt' -NoNewline }"

set /p "HWID=" <%TEMP%\hwid.txt

if "%HWID%"=="erro" (
  echo.
  echo Erro ao gerar HWID. Verifique conexao com a internet.
  pause
  exit /b 1
)

echo.
echo ===========================================
echo  SEU HWID (Other Store):
echo  %HWID%
echo ===========================================
echo.
echo Copie esse codigo e cole no painel Other Store.
echo.
start "" "!API_URL!/?hwid=%HWID%"

del "%TEMP%\hwid.txt" 2>nul

pause
