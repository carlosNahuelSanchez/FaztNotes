param(
    [Parameter(Position=0, Mandatory=$true)]
    [ValidateSet("start", "stop", "logs", "install")]
    [string]$Action
)

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

if (-not (Test-Path "$ProjectDir\.env")) {
    if (Test-Path "$ProjectDir\.env.example") {
        Write-Host "[NEXONOTES] Archivo .env no detectado. Creando desde .env.example..."
        Copy-Item "$ProjectDir\.env.example" "$ProjectDir\.env"
    }
}

switch ($Action) {
    "start" {
        Write-Host "[NEXONOTES-SYS] Iniciando servicios contenerizados..."
        docker compose up -d --build

        Write-Host "[NEXONOTES-SYS] Verificando salud de los servicios..."
        $maxAttempts = 30
        $attempt = 1
        $backendHealthy = $false

        while ($attempt -le $maxAttempts) {
            try {
                $status = docker inspect --format='{{json .State.Health.Status}}' nexonotes-backend 2>$null
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
        Write-Host ""
        Write-Host "  >> Tu aplicacion NexoNotes esta lista en: http://localhost:3780"
        Write-Host "  - Backend API:    http://localhost:8780"
        Write-Host "  - Documentacion:  http://localhost:8780/docs"
        Write-Host "  - Base de Datos:  localhost:5432 (pgvector activo)"
        Write-Host "------------------------------------------------------------"
    }

    "stop" {
        Write-Host "[NEXONOTES-SYS] Deteniendo contenedores de forma limpia..."
        docker compose down
        Write-Host "------------------------------------------------------------"
        Write-Host "[NEXONOTES-SYS] El sistema NexoNotes ha sido detenido correctamente."
        Write-Host "------------------------------------------------------------"
    }

    "logs" {
        Write-Host "[NEXONOTES-SYS] Acoplando flujo de logs combinados (Ctrl+C para salir)..."
        docker compose logs -f
    }

    "install" {
        Write-Host "[NEXONOTES-SYS] Configurando alias y acceso global en el sistema..."

        # 1. PowerShell Profile
        $profileDir = Split-Path -Parent $PROFILE
        if (-not (Test-Path $profileDir)) {
            New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
        }
        $funcCode = "`nfunction nexonotes { & '$ProjectDir\nexonotes.ps1' @args }`n"
        if (Test-Path $PROFILE) {
            $content = Get-Content $PROFILE -Raw
            if ($content -notmatch "function nexonotes") {
                Add-Content -Path $PROFILE -Value $funcCode
                Write-Host "[OK] Registrado en `$PROFILE ($PROFILE)"
            } else {
                Write-Host "[INFO] Ya existe funcion nexonotes en `$PROFILE"
            }
        } else {
            Set-Content -Path $PROFILE -Value $funcCode
            Write-Host "[OK] Creado `$PROFILE con la funcion nexonotes."
        }

        # 2. Git Bash .bashrc si existe
        $bashrc = "$HOME\.bashrc"
        if (Test-Path $bashrc) {
            $bashContent = Get-Content $bashrc -Raw
            if ($bashContent -notmatch "alias nexonotes=") {
                $driveLetter = $ProjectDir.Substring(0, 1).ToLower()
                $tailPath = ($ProjectDir.Substring(2) -replace '\\', '/')
                $unixPath = "/$driveLetter$tailPath"
                Add-Content -Path $bashrc -Value "`nalias nexonotes=`"$unixPath/nexonotes`"`n"
                Write-Host "[OK] Alias registrado en $bashrc"
            } else {
                Write-Host "[INFO] Ya existe alias en $bashrc"
            }
        }

        # 3. Registro en PATH de usuario de Windows para CMD y cualquier terminal
        $userPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
        if ($userPath -notlike "*$ProjectDir*") {
            [Environment]::SetEnvironmentVariable("Path", "$userPath;$ProjectDir", [EnvironmentVariableTarget]::User)
            Write-Host "[OK] Directorio del proyecto anadido al PATH de usuario en Windows."
        } else {
            Write-Host "[INFO] El directorio ya se encuentra en el PATH de usuario."
        }

        Write-Host "[NEXONOTES-SYS] Instalacion completada. 'nexonotes' esta disponible globalmente."
    }
}
