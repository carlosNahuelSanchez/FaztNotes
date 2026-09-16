param(
    [Parameter(Position=0, Mandatory=$true)]
    [ValidateSet("start", "stop", "logs")]
    [string]$Action
)

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

if (-not (Test-Path "$ProjectDir\.env")) {
    if (Test-Path "$ProjectDir\.env.example") {
        Write-Host "[FAZTNOTES] Archivo .env no detectado. Creando desde .env.example..."
        Copy-Item "$ProjectDir\.env.example" "$ProjectDir\.env"
    }
}

switch ($Action) {
    "start" {
        Write-Host "[FAZTNOTES-SYS] Iniciando servicios contenerizados..."
        docker compose up -d --build

        Write-Host "[FAZTNOTES-SYS] Verificando salud de los servicios..."
        $maxAttempts = 30
        $attempt = 1
        $backendHealthy = $false

        while ($attempt -le $maxAttempts) {
            try {
                $status = docker inspect --format='{{json .State.Health.Status}}' faztnotes-backend 2>$null
                if ($status -eq '"healthy"') {
                    $backendHealthy = $true
                    break
                }
            } catch {}
            Start-Sleep -Seconds 1
            $attempt++
        }

        Write-Host "------------------------------------------------------------"
        if ($backendHealthy) {
            Write-Host "[ESTADO: OPERATIVO] Todos los servicios se encuentran en ejecucion."
        } else {
            Write-Host "[ESTADO: INICIANDO] Backend aun completando verificacion."
        }
        Write-Host "  - Frontend UI:    http://localhost:3000"
        Write-Host "  - Backend API:    http://localhost:8000"
        Write-Host "  - Documentacion:  http://localhost:8000/docs"
        Write-Host "  - Base de Datos:  localhost:5432 (pgvector activo)"
        Write-Host "------------------------------------------------------------"
    }

    "stop" {
        Write-Host "[FAZTNOTES-SYS] Deteniendo contenedores de forma limpia..."
        docker compose down
        Write-Host "[FAZTNOTES-SYS] Sistema detenido."
    }

    "logs" {
        Write-Host "[FAZTNOTES-SYS] Acoplando flujo de logs combinados (Ctrl+C para salir)..."
        docker compose logs -f
    }
}
