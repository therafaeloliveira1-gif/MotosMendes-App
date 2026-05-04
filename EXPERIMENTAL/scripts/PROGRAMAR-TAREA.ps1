# SCRIPT DE POWERSHELL PARA PROGRAMAR LA ACTUALIZACION
# Ejecutar como ADMINISTRADOR

$Action = New-ScheduledTaskAction -Execute "C:\Windows\System32\cmd.exe" -Argument "/c `"$PSScriptRoot\..\AUTO-ACTUALIZAR.bat`""
$Trigger = New-ScheduledTaskTrigger -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 30)
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

Register-ScheduledTask -TaskName "MotosMendes-Actualizacion-SAP" -Action $Action -Trigger $Trigger -Settings $Settings -Description "Actualiza el catalogo de Motos Mendes cada 30 minutos desde SAP" -Force

Write-Host "✅ Tarea programada exitosamente: MotosMendes-Actualizacion-SAP" -ForegroundColor Green
Write-Host "ℹ️ La proxima ejecucion sera en 30 minutos."
