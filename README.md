# FaztNotes

Sistema de gestion de notas con motor RAG (Retrieval-Augmented Generation) y asistente ejecutivo Nexo.

## Arquitectura

- **Base de Datos**: PostgreSQL 16 con extension `pgvector` (almacenamiento relacional y vectorial atomico).
- **Backend**: FastAPI (Python 3.11), SQLAlchemy 2.0, SDK Gemini (`text-embedding-004` de 768 dimensiones y `gemini-1.5-flash`).
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Nginx reverse proxy.
- **Orquestacion**: Docker Compose.

## Requisitos Previos

- Docker y Docker Compose v2+.
- Clave de API de Google Gemini (`GEMINI_API_KEY`).

## Variables de Entorno

Copiar `.env.example` a `.env` y configurar su clave de Gemini:

```bash
cp .env.example .env
```

Contenido de `.env`:
```env
GEMINI_API_KEY=tu_clave_de_gemini
POSTGRES_DB=faztnotes_db
POSTGRES_USER=faztnotes_admin
POSTGRES_PASSWORD=faztnotes_secure_pass
POSTGRES_PORT=5432
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

## Operacion del Sistema

El script `faztnotes` permite controlar el ciclo de vida de los contenedores:

```bash
# Iniciar servicios en segundo plano y comprobar estado de salud
./faztnotes start

# Visualizar logs unificados
./faztnotes logs

# Detener servicios limpiamente
./faztnotes stop
```

En entornos Windows PowerShell:
```powershell
.\faztnotes.ps1 start
.\faztnotes.ps1 logs
.\faztnotes.ps1 stop
```

## Acceso

- Interfaz Web: `http://localhost:3000`
- API REST / Swagger: `http://localhost:8000/docs`
- Healthcheck: `http://localhost:8000/health`

## Asistente Nexo

Nexo opera bajo restricciones estrictas:
- Respuestas generadas exclusivamente a partir del contexto recuperado de las notas.
- Citacion explicita de fuentes en formato `[Fuente: Titulo (ID)]`.
- Declaracion estricta en caso de ausencia de contexto: *"No hay información en las notas sobre este tema."*
- Cero emojis y cero florituras decorativas.
