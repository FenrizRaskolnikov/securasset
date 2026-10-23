@echo off
title SecureInventory - Autostart System
cd /d "C:\Users\jeste\Desktop\SecureInventory"

echo Iniciando PocketBase...
start "PocketBase Backend" cmd /k "database\pocketbase.exe serve --http=0.0.0.0:8090"

:: Damos 2 segundos para que PocketBase levante primero
timeout /t 2 /nobreak > nul

echo Iniciando Aplicacion Svelte/Node...
start "Frontend Svelte" cmd /k "npm run dev -- --host"

:: Si tienes scripts de Python o Node esenciales para el monitoreo, descomenta y ajusta esta línea:
start "Script Monitoreo Python" cmd /k "python agente-endpoint/agente.py"
start "Monitoreo de Shadow IT" cmd /k "node backend-red/worker-network.js"
start "Monitoreo Agentless" cmd /k "node backend-red/worker-agentless.js"
start "Monitoreo Servidores/NVRs" cmd /k "node backend-red/worker-audit.js"

exit