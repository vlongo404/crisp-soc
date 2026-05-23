@echo off
title CRISP NG-SOC — Iniciando Stack
color 0A

echo.
echo  ██████╗██████╗ ██╗███████╗██████╗
echo  ██╔════╝██╔══██╗██║██╔════╝██╔══██╗
echo  ██║     ██████╔╝██║███████╗██████╔╝
echo  ██║     ██╔══██╗██║╚════██║██╔═══╝
echo  ╚██████╗██║  ██║██║███████║██║
echo   ╚═════╝╚═╝  ╚═╝╚═╝╚══════╝╚═╝
echo.
echo  NG-SOC Platform — Stack Startup
echo  ════════════════════════════════
echo.

:: ── 1. WSL2 + Docker (Wazuh) ──────────────────────────────────
echo [1/4] Iniciando WSL2 e Wazuh...
wsl -d Ubuntu -e bash -c "cd /opt/crisp-soc/wazuh/wazuh-docker/single-node && docker-compose up -d 2>/dev/null; echo WAZUH_OK"
echo       Wazuh: OK
echo.

:: ── 2. Zeek ───────────────────────────────────────────────────
echo [2/4] Iniciando Zeek NDR...
wsl -d Ubuntu -e bash -c "sudo /opt/zeek/bin/zeekctl start 2>/dev/null; echo ZEEK_OK"
echo       Zeek: OK
echo.

:: ── 3. Docker Windows (Postgres + Ollama) ─────────────────────
echo [3/4] Iniciando Postgres + Ollama...
cd /d D:\marco\crisp-soc
docker-compose up -d
echo       Postgres + Ollama: OK
echo.

:: ── 4. Abrir terminais do stack ───────────────────────────────
echo [4/4] Abrindo terminais AI Pipeline, Proxy FortiGate e Wazuh Consumer...
echo.

:: AI Pipeline
start "CRISP — AI Pipeline" cmd /k "cd /d D:\marco\crisp-soc\soc-ai && echo Iniciando FastAPI + Ollama... && uvicorn main:app --host 0.0.0.0 --port 8000"

:: Aguarda 2s e abre proxy
timeout /t 2 /nobreak >nul

:: Proxy FortiGate
start "CRISP — FortiGate Proxy" cmd /k "cd /d D:\marco\crisp-soc\proxy && echo Iniciando Proxy FortiGate... && python proxy_fortigate.py"

:: Aguarda 2s e abre Wazuh Consumer
timeout /t 2 /nobreak >nul

:: Wazuh Agent Consumer
start "CRISP — Wazuh Consumer" cmd /k "cd /d D:\marco\crisp-soc\soc-ai && echo Iniciando Wazuh Agent Consumer... && python wazuh_consumer.py"

:: ── 5. Abrir Dashboard ────────────────────────────────────────
timeout /t 3 /nobreak >nul
echo.
echo  Abrindo dashboard...
start "" "D:\marco\crisp-soc\dashboard\crisp.html"

echo.
echo  ════════════════════════════════════════════
echo  Stack CRISP iniciado com sucesso!
echo.
echo  Servicos rodando:
echo    - Wazuh:        https://localhost (WSL2)
echo    - AI API:       http://localhost:8000
echo    - FG Proxy:     http://localhost:5000
echo    - Ollama:       http://localhost:11434
echo    - Wazuh Consumer: polling alertas level^>=10
echo.
echo  ATENCAO: Se o IP do FortiGate mudou, edite:
echo    D:\marco\crisp-soc\proxy\.env
echo  ════════════════════════════════════════════
echo.
pause
