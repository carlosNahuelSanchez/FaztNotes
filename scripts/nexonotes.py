#!/usr/bin/env python3
"""
NexoNotes CLI — Automated MCP Management
Usage:
    nexonotes mcp-auto
    nexonotes mcp-list
"""
import os
import sys
import json
from pathlib import Path

# Color helpers for terminal
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

REPO_ROOT = Path(__file__).resolve().parent.parent

def get_agent_configs():
    home = Path.home()
    appdata = Path(os.getenv("APPDATA", home / "AppData" / "Roaming"))
    
    return {
        "1": {
            "name": "Antigravity (Global)",
            "key": "antigravity",
            "path": home / ".gemini" / "config" / "mcp_config.json",
            "entry": {
                "serverUrl": "http://localhost:8781/sse"
            }
        },
        "2": {
            "name": "Cursor (Proyecto local)",
            "key": "cursor",
            "path": REPO_ROOT / ".cursor" / "mcp.json",
            "entry": {
                "url": "http://localhost:8781/sse"
            }
        },
        "3": {
            "name": "Claude Desktop",
            "key": "claude",
            "path": (
                appdata / "Claude" / "claude_desktop_config.json"
                if sys.platform == "win32"
                else (
                    home / "Library" / "Application Support" / "Claude" / "claude_desktop_config.json"
                    if sys.platform == "darwin"
                    else home / ".config" / "Claude" / "claude_desktop_config.json"
                )
            ),
            "entry": {
                "url": "http://localhost:8781/sse"
            }
        },
        "4": {
            "name": "Windsurf",
            "key": "windsurf",
            "path": home / ".codeium" / "windsurf" / "mcp_config.json",
            "entry": {
                "serverUrl": "http://localhost:8781/sse"
            }
        }
    }

def inject_mcp(target_path: Path, entry: dict) -> bool:
    try:
        target_path.parent.mkdir(parents=True, exist_ok=True)
        data = {}
        if target_path.exists() and target_path.stat().st_size > 0:
            try:
                with open(target_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception:
                data = {}

        if "mcpServers" not in data or not isinstance(data["mcpServers"], dict):
            data["mcpServers"] = {}

        data["mcpServers"]["nexonotes"] = entry

        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        return True
    except Exception as e:
        print(f"{RED}[ERROR]{RESET} No se pudo escribir en {target_path}: {e}")
        return False

def cmd_mcp_list():
    configs = get_agent_configs()
    print(f"\n{GREEN}{BOLD}=== NEXONOTES // ESTADO DE CONFIGURACIÓN MCP ==={RESET}")
    print(f"Endpoint activo: {CYAN}http://localhost:8781/sse{RESET}\n")

    for idx, c in configs.items():
        p = c["path"]
        name = c["name"]
        configured = False

        if p.exists() and p.stat().st_size > 0:
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    servers = data.get("mcpServers", {})
                    if "nexonotes" in servers:
                        configured = True
            except Exception:
                pass

        status_tag = f"{GREEN}[CONFIGURADO]{RESET}" if configured else f"{YELLOW}[NO CONFIGURADO]{RESET}"
        print(f"  {status_tag} {BOLD}{name}{RESET}")
        print(f"      Ruta: {p}")

    print(f"\n{CYAN}Para auto-configurar uno o varios agentes, ejecuta:{RESET}")
    print(f"  {BOLD}nexonotes mcp-auto{RESET}\n")

def cmd_mcp_auto():
    configs = get_agent_configs()
    print(f"\n{GREEN}{BOLD}===================================================={RESET}")
    print(f"{GREEN}{BOLD}       NEXONOTES // MCP AUTO-CONFIGURATOR           {RESET}")
    print(f"{GREEN}{BOLD}===================================================={RESET}")
    print("¿A qué agente deseas conectar NexoNotes?\n")

    for k, c in configs.items():
        print(f"  [{k}] {c['name']}")
    print(f"  [5] Todos los agentes anteriores")
    print(f"  [0] Salir\n")

    choice = input("Selecciona una opción [1-5]: ").strip()

    if choice == "0":
        print("Operación cancelada.")
        return

    targets = []
    if choice in configs:
        targets.append(configs[choice])
    elif choice == "5":
        targets.extend(configs.values())
    else:
        print(f"{RED}Opción inválida.{RESET}")
        return

    print()
    for t in targets:
        success = inject_mcp(t["path"], t["entry"])
        if success:
            print(f"{GREEN}[OK]{RESET} {BOLD}{t['name']}{RESET} configurado con éxito:")
            print(f"     -> {t['path']}")
        else:
            print(f"{RED}[FAIL]{RESET} Falló la configuración de {t['name']}")

def cmd_install():
    print(f"\n{GREEN}{BOLD}=== NEXONOTES // INSTALACIÓN GLOBAL DEL COMANDO ==={RESET}")
    repo_dir = str(REPO_ROOT)
    script_path = str(REPO_ROOT / "scripts" / "nexonotes.py")

    if sys.platform == "win32":
        # 1. Add REPO_ROOT to Windows User PATH environment variable
        try:
            import subprocess
            ps_cmd = (
                f'$userPath = [Environment]::GetEnvironmentVariable("Path", "User"); '
                f'if ($userPath -notlike "*{repo_dir}*") {{ '
                f'[Environment]::SetEnvironmentVariable("Path", "$userPath;{repo_dir}", "User"); '
                f'}}'
            )
            subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], check=True, capture_output=True)
            print(f"  {GREEN}[OK]{RESET} Añadido al PATH de usuario de Windows:")
            print(f"      -> {repo_dir}")
        except Exception as e:
            print(f"  {YELLOW}[AVISO]{RESET} No se pudo modificar el registro de PATH: {e}")

        # 2. Write global wrappers in known PATH directories (AppData/npm, Local/Microsoft/WindowsApps, etc.)
        candidates = [
            Path(os.getenv("APPDATA", "")) / "npm",
            Path.home() / "AppData" / "Local" / "Microsoft" / "WindowsApps",
            Path.home() / "bin",
            Path.home() / ".local" / "bin",
        ]
        created_in = []
        for cand in candidates:
            if cand.exists() and cand.is_dir():
                try:
                    cmd_file = cand / "nexonotes.cmd"
                    ps1_file = cand / "nexonotes.ps1"
                    with open(cmd_file, "w", encoding="utf-8") as f:
                        f.write(f'@echo off\npython "{script_path}" %*\n')
                    with open(ps1_file, "w", encoding="utf-8") as f:
                        f.write(f'& python "{script_path}" @args\n')
                    created_in.append(str(cand))
                except Exception:
                    pass

        if created_in:
            print(f"  {GREEN}[OK]{RESET} Lanzadores globales creados en:")
            for c in created_in:
                print(f"      -> {c}\\nexonotes.cmd")
        else:
            print(f"  {GREEN}[OK]{RESET} Lanzador root: {repo_dir}\\nexonotes.bat")

    else:
        # Linux / macOS
        local_bin = Path.home() / ".local" / "bin"
        local_bin.mkdir(parents=True, exist_ok=True)
        symlink = local_bin / "nexonotes"
        try:
            if symlink.is_symlink() or symlink.exists():
                symlink.unlink()
            symlink.symlink_to(REPO_ROOT / "nexonotes")
            print(f"  {GREEN}[OK]{RESET} Enlace simbólico creado:")
            print(f"      -> {symlink}")
        except Exception as e:
            print(f"  {YELLOW}[AVISO]{RESET} No se pudo crear symlink en ~/.local/bin: {e}")

    print(f"\n{GREEN}{BOLD}¡Instalación global completada!{RESET}")
    print(f"Ahora puedes abrir cualquier terminal desde cualquier carpeta y ejecutar:")
    print(f"  {BOLD}nexonotes mcp-auto{RESET}   (Configurar agentes)")
    print(f"  {BOLD}nexonotes mcp-list{RESET}   (Ver estado de conexión)")
    print(f"  {BOLD}nexonotes --help{RESET}     (Ayuda)\n")

def cmd_start():
    import subprocess
    print(f"\n{GREEN}{BOLD}[NEXONOTES-SYS] Iniciando servicios contenerizados...{RESET}")
    subprocess.run(["docker", "compose", "up", "-d", "--build"], cwd=str(REPO_ROOT))
    print(f"\n{GREEN}[OK]{RESET} Tu aplicacion NexoNotes esta lista en: {CYAN}http://localhost:3780{RESET}")
    print(f"  - Backend API:    {CYAN}http://localhost:8780{RESET}")
    print(f"  - Servidor MCP:   {CYAN}http://localhost:8781/sse{RESET}")
    print(f"  - Documentacion:  {CYAN}http://localhost:8780/docs{RESET}\n")

def cmd_stop():
    import subprocess
    print(f"\n{YELLOW}[NEXONOTES-SYS] Deteniendo contenedores de forma limpia...{RESET}")
    subprocess.run(["docker", "compose", "down"], cwd=str(REPO_ROOT))
    print(f"{GREEN}[OK]{RESET} Todos los servicios han sido detenidos preservando los datos.\n")

def cmd_logs():
    import subprocess
    print(f"\n{CYAN}[NEXONOTES-SYS] Acoplando flujo de logs en tiempo real (Ctrl+C para salir)...{RESET}")
    try:
        subprocess.run(["docker", "compose", "logs", "-f"], cwd=str(REPO_ROOT))
    except KeyboardInterrupt:
        pass

def cmd_status():
    import subprocess
    subprocess.run(["docker", "compose", "ps"], cwd=str(REPO_ROOT))

def main():
    args = sys.argv[1:]
    if not args or args[0] in ["-h", "--help", "help"]:
        print(f"\n{GREEN}{BOLD}Nexonotes CLI{RESET}")
        print("Comandos disponibles:")
        print("  nexonotes start     : Compila e inicia todos los servicios con Docker")
        print("  nexonotes stop      : Detiene los contenedores de forma limpia")
        print("  nexonotes logs      : Visualiza los logs combinados en tiempo real")
        print("  nexonotes status    : Consulta el estado de los contenedores Docker")
        print("  nexonotes install   : Instala 'nexonotes' globalmente en tu sistema operativo")
        print("  nexonotes mcp-auto  : Asistente interactivo para inyectar MCP en tus agentes")
        print("  nexonotes mcp-list  : Lista los agentes y el estado de configuración de NexoNotes MCP\n")
        return

    cmd = args[0].lower()
    if cmd == "start":
        cmd_start()
    elif cmd == "stop":
        cmd_stop()
    elif cmd == "logs":
        cmd_logs()
    elif cmd in ["status", "ps"]:
        cmd_status()
    elif cmd == "install":
        cmd_install()
    elif cmd == "mcp-auto":
        cmd_mcp_auto()
    elif cmd == "mcp-list":
        cmd_mcp_list()
    else:
        print(f"{RED}Comando desconocido:{RESET} '{cmd}'")
        print("Usa 'nexonotes --help' para ver los comandos disponibles.")

if __name__ == "__main__":
    main()
