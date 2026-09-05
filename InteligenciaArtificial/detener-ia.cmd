@echo off
powershell.exe -NoProfile -Command "$p = Get-NetTCPConnection -LocalPort 8001 -State Listen -ErrorAction SilentlyContinue; if ($p) { Stop-Process -Id $p.OwningProcess; Write-Host 'Servicio de IA detenido.' } else { Write-Host 'La IA no esta ejecutandose.' }"

