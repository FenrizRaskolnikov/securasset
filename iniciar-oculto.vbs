Set WshShell = CreateObject("WScript.Shell")
Dim projectPath
projectPath = "C:\Users\jeste\Desktop\SecureInventory"

' 1. Iniciar PocketBase oculto y guardar registro en database/pocketbase.log
WshShell.Run "cmd /c ""cd /d " & projectPath & " && database\pocketbase.exe serve --http=0.0.0.0:8090 > database\pocketbase.log 2>&1""", 0, False

' Damos 2 segundos para que PocketBase alcance a levantar la base de datos
WScript.Sleep 2000

' 2. Iniciar Svelte / Frontend oculto y guardar registro en svelte.log
WshShell.Run "cmd /c ""cd /d " & projectPath & " && npm run dev -- --host > svelte.log 2>&1""", 0, False

' 3. Iniciar Agente Python
WshShell.Run "cmd /c ""cd /d " & projectPath & " && python agente-endpoint/agente.py > agente.log 2>&1""", 0, False

' 4. Iniciar Monitoreo de Shadow IT
WshShell.Run "cmd /c ""cd /d " & projectPath & " && node backend-red/worker-network.js > worker-network.log 2>&1""", 0, False

' 5. Iniciar Monitoreo Agentless
WshShell.Run "cmd /c ""cd /d " & projectPath & " && node backend-red/worker-agentless.js > worker-agentless.log 2>&1""", 0, False

' 6. Iniciar Monitoreo Servidores/NVRs
WshShell.Run "cmd /c ""cd /d " & projectPath & " && node backend-red/worker-audit.js > worker-audit.log 2>&1""", 0, False