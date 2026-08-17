@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

set "API_URL=https://vgsellers.lat"

echo Gerando identificador unico (HWID) pela API...

for /f "usebackq delims=" %%a in (
  `powershell -NoProfile -Command "$OutputEncoding = [Console]::OutputEncoding = [Text.Encoding]::UTF8; (Invoke-RestMethod -Uri '!API_URL!/api/reseller/v1/other-store/hwid' -Method POST).hwid"`
) do set "HWID=%%a"

if not defined HWID (
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

pause
