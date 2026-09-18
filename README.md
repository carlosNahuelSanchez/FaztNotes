<!-- prettier-ignore -->
<div align="center">

<img src="./logo-animated.gif" alt="Logo de NexoNotes" height="100" />

# NexoNotes

*Sistema Autónomo y Privado de Gestión de Documentos Técnicos, Motor RAG y Servidor MCP*

[![English Documentation](https://img.shields.io/badge/Language-English-blue.svg)](README_en.md)
[![License: PolyForm Noncommercial](https://img.shields.io/badge/Licencia-Software_Libre_No_Comercial-green.svg)](LICENSE.md)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-24%2B-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![MCP](https://img.shields.io/badge/MCP-Dual_Transport-00FF66?style=flat-square&logo=anthropic&logoColor=black)](https://modelcontextprotocol.io/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E7CC3?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

[Descripción General](#descripción-general) • [Arquitectura](#arquitectura-del-sistema) • [Puertos del Sistema](#puertos-del-sistema) • [Requisitos Previos](#requisitos-previos) • [Inicio Rápido](#inicio-rápido) • [Comandos CLI](#comandos-cli) • [Integración MCP](#integración-mcp-model-context-protocol) • [Dashboard de Estadísticas](#dashboard-de-estadísticas) • [Características](#características-principales) • [Referencia API](#referencia-de-la-api) • [Licencia](#licencia)

</div>

---

> [!NOTE]
> **Documentación en Inglés:** Puedes consultar la versión en inglés de esta documentación en [README_en.md](README_en.md).

---

## Descripción General

**NexoNotes** es un sistema autónomo y privado de gestión de documentación técnica con un motor **RAG (Retrieval-Augmented Generation)** integrado y servidor nativo **MCP (Model Context Protocol)**, contenerizado de forma completa mediante Docker.

Diseñado específicamente para desarrolladores e ingenieros de software, NexoNotes destaca por su **estética Hacker / Matrix CLI**, su velocidad instantánea y su capacidad de conectar tu base de conocimiento local tanto a un asistente interactivo propio como a cualquier agente externo de IA (Antigravity, Cursor, Claude Desktop, Windsurf) a través de MCP.

> [!IMPORTANT]
> Todas las notas se almacenan localmente en PostgreSQL y se vectorizan automáticamente en embeddings de 768 dimensiones utilizando `pgvector`. Tus datos permanecen 100% bajo tu control, sin delegar vectores ni documentos a servicios en la nube de terceros.

---

## Arquitectura del Sistema

```
[ Navegador Web ]                      [ Agentes IA Externos ]
       │                         (Antigravity / Cursor / Claude / Windsurf)
       ▼ (Puerto 3780)                         │
[ Frontend: React 18 + Nginx ]                 ▼ (Puerto 8781)
       │                              [ Servidor MCP Híbrido ]
       ▼ (Proxy interno /api/)       (Streamable HTTP + Legacy SSE)
[ Backend: FastAPI (Python 3.11) ]             │
       │                                       │
       ├───────────────────────────────────────┘
       ▼
[ Base de Datos: PostgreSQL 16 + pgvector ] ───► [ Motor IA: Gemini API ]
    ├── notes (id, title, content, tags, ...)    (text-embedding / gemini-3.5-flash-lite)
    └── embedding (Vector 768d + índice HNSW)
```

- **Base de Datos y Almacenamiento Vectorial:** PostgreSQL 16 con extensión `pgvector` e índice HNSW para búsquedas semánticas de alta velocidad.
- **Backend API:** FastAPI (Python 3.11), SQLAlchemy 2.0, Microsoft MarkItDown, exportación global (JSON/CSV), webhooks y streaming SSE.
- **Servidor MCP Dual-Transport:** Proceso FastAPI/Starlette independiente en el puerto `8781` con soporte simultáneo para **Streamable HTTP** (Antigravity, Gemini CLI) y **Legacy SSE** (Cursor, Claude Desktop).
- **Frontend SPA:** React 18, TypeScript y Tailwind CSS con persistencia total de estado entre pestañas, dashboard de telemetría y diseño Matrix.
- **Orquestación:** Despliegue multicontenedor con `docker compose` (4 contenedores saludables y aislados).

---

## Puertos del Sistema

| Servicio | Endpoint | Descripción |
| :--- | :--- | :--- |
| **Interfaz Frontend** | `http://localhost:3780` | Panel de gestión de notas, consola Nexo y telemetría |
| **Backend API** | `http://localhost:8780` | Endpoints REST, analíticas y streaming RAG |
| **Documentación API** | `http://localhost:8780/docs` | Interfaz interactiva OpenAPI / Swagger |
| **Servidor MCP** | `http://localhost:8781/sse` | Protocolo MCP (Streamable HTTP y Legacy SSE) |
| **PostgreSQL** | `localhost:5432` | Base de datos relacional y almacén vectorial `pgvector` |

---

## Requisitos Previos

- **Docker Engine** 24.0+ y **Docker Compose** v2.0+
- **Python 3.10+** (para los comandos globales de CLI)
- **Clave de API de Google Gemini** (`GEMINI_API_KEY`)

---

## Inicio Rápido

### 1. Clonar el Repositorio

```bash
git clone https://github.com/carlosNahuelSanchez/NexoNotes.git
cd NexoNotes
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
```

*(En Windows PowerShell: `Copy-Item .env.example .env`)*

Edita el archivo `.env` e ingresa tu clave de API de Google Gemini:

```env
GEMINI_API_KEY=tu_clave_real_de_gemini
POSTGRES_DB=nexonotes_db
POSTGRES_USER=nexonotes_admin
POSTGRES_PASSWORD=nexonotes_secure_pass
POSTGRES_PORT=5432
BACKEND_PORT=8780
FRONTEND_PORT=3780
LLM_MODEL=gemini-3.5-flash-lite
WEBHOOK_URL=
```

### 3. Registrar el Comando Global CLI

Instala el comando `nexonotes` para usarlo globalmente desde cualquier directorio del sistema operativo:

```bash
# Windows (CMD o PowerShell):
nexonotes install

# Linux / macOS / Git Bash:
./nexonotes install
```

### 4. Iniciar el Sistema

```bash
nexonotes start
```

Accede a la interfaz web en **`http://localhost:3780`**.

---

## Comandos CLI

El CLI de NexoNotes incluye gestión de contenedores y configuración automatizada de agentes MCP:

| Comando | Descripción |
| :--- | :--- |
| `nexonotes install` | Registra el comando `nexonotes` en el PATH global del sistema operativo |
| `nexonotes mcp-auto` | Asistente interactivo en 1 clic para inyectar NexoNotes MCP en tus agentes |
| `nexonotes mcp-list` | Lista los agentes detectados y su estado de vinculación MCP |
| `nexonotes start` | Compila las imágenes y levanta los 4 contenedores en segundo plano |
| `nexonotes stop` | Detiene los contenedores de forma limpia preservando los datos de PostgreSQL |
| `nexonotes logs` | Visualiza los registros combinados de todos los servicios en tiempo real |

---

## Integración MCP (Model Context Protocol)

NexoNotes cuenta con un servidor nativo de **Model Context Protocol (MCP)** en el puerto `8781` que expone tu base de conocimiento local para que cualquier agente inteligente pueda buscar, leer, crear notas o consultar a Nexo directamente desde su entorno de desarrollo.

### Arquitectura Dual Híbrida

A diferencia de servidores MCP convencionales que fallan con error `405 Method Not Allowed`, NexoNotes implementa un servidor ASGI con **doble transporte simultáneo**:

1. **Streamable HTTP (`POST /sse`, `POST /mcp`, `POST /`):** Soporta el estándar moderno de MCP utilizado por **Antigravity**, **Gemini CLI** y herramientas de nueva generación.
2. **Legacy SSE (`GET /sse` + `POST /messages/`):** Soporta la especificación SSE tradicional utilizada por **Cursor**, **Claude Desktop** y **Windsurf**.

### Herramientas Expuestas para Agentes

| Herramienta | Firma | Descripción |
| :--- | :--- | :--- |
| `search_notes` | `query: str, top_k: int = 4` | Búsqueda semántica vectorial en `pgvector` con similitud coseno |
| `get_note` | `note_id: str` | Obtiene el contenido Markdown completo y los metadatos de una nota |
| `list_notes` | `folder: str?, tag: str?` | Lista hasta 50 notas filtrando por carpeta o etiqueta |
| `create_note` | `title, content, folder?, tags?` | Crea una nueva nota e indexa automáticamente sus embeddings vectoriales |
| `list_folders` | `None` | Devuelve la lista completa de todas las carpetas existentes |
| `ask_nexo` | `question: str, top_k: int = 4` | Ejecuta el pipeline RAG local y devuelve una respuesta fundamentada con citas |

### Conexión Rápida en 1 Comando

Para configurar tus agentes automáticamente, ejecuta desde cualquier terminal:

```bash
nexonotes mcp-auto
```

El script te preguntará a qué agente deseas conectar NexoNotes:
- `[1]` Antigravity (Global `~/.gemini/config/mcp_config.json`)
- `[2]` Cursor (`.cursor/mcp.json`)
- `[3]` Claude Desktop (`claude_desktop_config.json`)
- `[4]` Windsurf (`~/.codeium/windsurf/mcp_config.json`)
- `[5]` Claude Code (`~/.claude.json` / CLI)
- `[6]` OpenCode (`~/.config/opencode/opencode.json`)
- `[7]` Todos los anteriores

Para verificar el estado de conexión de tus agentes en cualquier momento:

```bash
nexonotes mcp-list
```

### Configuración Manual

Si prefieres agregarlo manualmente al archivo de configuración de tu agente:

```json
{
  "mcpServers": {
    "nexonotes": {
      "serverUrl": "http://localhost:8781/sse"
    }
  }
}
```

---

## Dashboard de Estadísticas

Accesible mediante el icono de gráfico de barras `<BarChartIcon />` en la cabecera (o con la tecla `F3`), el dashboard de telemetría ofrece una vista integral del estado del sistema con tipografía técnica cuadrada (`Chakra Petch` & `Share Tech Mono`) y estética Matrix:

- **Indicadores Clave:** Total de notas, total de carpetas y total de etiquetas únicas.
- **Salud del Motor Vectorial:** Contador de notas vectorizadas en `pgvector` vs pendientes de embedding con barra de progreso porcentual.
- **Diagnóstico de Infraestructura:** Latencia en tiempo real de PostgreSQL (ms), conectividad con la API de Gemini y estado del servidor MCP.
- **Desglose de Carpetas y Etiquetas:** Listado completo con scroll interno independiente para workspaces con cientos de elementos.
- **Gráfico Interactivo de Actividad (Últimos 14 días):**
  - Barras interactivas con oscurecimiento al pasar el cursor y visualización de fecha completa (Día, Mes, Año) y volumen de notas.
  - **Popup flotante suave:** Al hacer clic en cualquier barra, se abre un popup encima con el listado de notas creadas o modificadas en ese día.
  - **Navegación instantánea:** Al pulsar sobre cualquier nota del popup, el sistema te redirige a `[1] NOTAS`, selecciona la nota y abre automáticamente su carpeta en el árbol.

---

## Características Principales

- **Persistencia de Estados entre Pestañas:** Puedes alternar libremente entre `[1] NOTAS`, `[2] NEXO`, `[3] ESTADÍSTICAS` o abrir el modal MCP sin perder el texto que estés editando ni el estado de expansión de tus carpetas.
- **Carpetas Colapsadas por Defecto con Auto-Expansión:** El explorador inicia limpio con las carpetas cerradas. Al buscar texto o hacer clic en una etiqueta, las carpetas que contengan coincidencias se expanden automáticamente.
- **Explorador Jerárquico & Drag & Drop:** Árbol de archivos real estilo IDE con soporte para arrastrar notas y carpetas (incluyendo soltar en la raíz `/` o desde el explorador del sistema operativo).
- **Importación Inteligente (MarkItDown):** Soporte para archivos `.md`, `.txt`, Word (`.docx`), PDF (`.pdf`) y `.zip` con conversión automatizada a Markdown.
- **Exportación Completa del Workspace:** Descarga individual en Markdown (`.md`) o exportación completa del repositorio en formato **JSON** estructurado o planilla **Excel / CSV**.
- **Consola IA Nexo (RAG Local):** Respuestas generadas en tiempo real token por token vía SSE, fundamentadas con citas directas `[Fuente: Título (ID)]` sobre vectores en `pgvector`.
- **Integración con Webhooks:** Envío opcional de eventos salientes (`POST`) a una URL configurada (`WEBHOOK_URL`) ante creaciones o modificaciones de notas.

---

## Referencia de la API

### Endpoints de Notas y RAG (Backend: Puerto 8780)

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/health` | Estadísticas del sistema, estado de PostgreSQL, Gemini, MCP y actividad de 14 días |
| `GET` | `/api/stats` | Alias del endpoint de métricas y telemetría del dashboard |
| `GET` | `/api/notes` | Listado de notas con filtros de `search`, `tag` y `folder` |
| `POST` | `/api/notes` | Creación de nota con indexación inmediata en `pgvector` y disparo de webhook |
| `POST` | `/api/notes/import` | Importa y convierte archivos `.md`, Word, PDF y ZIP a Markdown |
| `GET` | `/api/notes/{id}/export` | Descarga la nota individual en formato Markdown (`.md`) |
| `GET` | `/api/notes/export/folder` | Exporta carpetas o el workspace completo en `.zip` |
| `GET` | `/api/notes/export/all` | Exportación completa en **JSON** o **CSV/Excel** (`?format=json\|csv`) |
| `PUT` | `/api/notes/{id}` | Actualización de nota y regeneración de vector |
| `PUT` | `/api/notes/folder/rename` | Renombra una carpeta y actualiza las rutas de sus notas en PostgreSQL |
| `DELETE` | `/api/notes/{id}` | Eliminación de nota e índice vectorial |
| `DELETE` | `/api/notes/folder` | Elimina una carpeta completa con sus notas y subcarpetas |
| `GET` | `/api/notes/folders` | Lista de carpetas activas |
| `GET` | `/api/notes/tags` | Lista de etiquetas registradas |
| `GET` | `/api/nexo/stream` | Transmisión en tiempo real de respuestas RAG vía SSE |
| `POST` | `/api/webhooks/test` | Prueba el envío de notificaciones webhook |

### Endpoints del Servidor MCP (Puerto 8781)

| Método | Endpoint | Transporte | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/sse`, `/mcp`, `/` | Streamable HTTP | Inicialización y ejecución de herramientas JSON-RPC (Antigravity, Gemini) |
| `GET` | `/sse` | Legacy SSE | Canal de Server-Sent Events tradicional (Cursor, Claude Desktop) |
| `POST` | `/messages/` | Legacy SSE | Recepción de mensajes JSON-RPC para sesiones SSE activas |
| `DELETE` | `/sse`, `/mcp` | Streamable HTTP | Cierre y terminación de sesiones MCP |

---

## Estructura del Proyecto

```
NexoNotes/
├── LICENSE.md            # Licencia PolyForm Noncommercial 1.0.0
├── .env.example          # Plantilla de variables de entorno (con GEMINI_API_KEY y WEBHOOK_URL)
├── docker-compose.yml    # Orquestación multicontenedor (db, backend, frontend, mcp)
├── nexonotes             # Script de entrada para Linux / macOS / Git Bash
├── nexonotes.bat         # Script de entrada para Windows CMD
├── nexonotes.cmd         # Lanzador para Windows CMD en PATH global
├── nexonotes.ps1         # Script ejecutable para Windows PowerShell
├── README.md             # Documentación principal en Español
├── README_en.md          # Documentación en Inglés
├── backend/              # Servicio FastAPI con pgvector, MarkItDown y pipeline RAG
│   ├── app/
│   │   ├── main.py       # API FastAPI y telemetría de salud
│   │   ├── mcp_server.py # Servidor MCP híbrido dual (Streamable HTTP + Legacy SSE)
│   │   ├── database.py   # Conexión SQLAlchemy y pgvector HNSW
│   │   ├── models.py     # Modelo Note con Vector(768)
│   │   ├── routers/      # Endpoints modulares de notas y RAG
│   │   └── services/     # RAG con Gemini, MarkItDown y Webhooks
│   └── Dockerfile
├── frontend/             # SPA React 18 + TypeScript servida por Nginx
│   ├── src/
│   │   ├── App.tsx       # Shell principal con persistencia de pestañas
│   │   ├── components/
│   │   │   ├── FolderTree.tsx   # Árbol de carpetas colapsable con D&D
│   │   │   ├── NotesManager.tsx # Editor split-view con render Markdown
│   │   │   ├── NexoConsole.tsx  # Terminal RAG con citas y streaming
│   │   │   ├── SystemStats.tsx  # Dashboard de telemetría y gráfico interactivo
│   │   │   ├── McpModal.tsx     # Modal interactivo con guías de conexión MCP
│   │   │   └── Header.tsx       # Barra de navegación Matrix
│   │   └── index.css     # Estilos y fuentes Chakra Petch + Share Tech Mono
│   └── Dockerfile
└── scripts/              # Herramientas de automatización CLI
    ├── nexonotes.py      # Motor CLI para instalación global y auto-MCP
    ├── setup-mcp.bat     # Lanzador rápido de configuración MCP para Windows
    └── setup-mcp.sh      # Lanzador rápido de configuración MCP para Linux/macOS
```

---

## Licencia

Este proyecto es software libre y de código abierto bajo los términos de la licencia **[PolyForm Noncommercial License 1.0.0](LICENSE.md)**.

- **Uso Permitido:** Eres libre de descargar, compilar, estudiar, modificar, adaptar y distribuir este proyecto para fines personales, educativos, de investigación o de gestión interna.
- **Restricción Comercial:** Queda estrictamente prohibido vender, sublicenciar, revender o comercializar este software o sus derivados como un producto o servicio de venta cerrado con fines de lucro comercial directo.

---

## Apoyo al Proyecto

Si **NexoNotes** te resulta de utilidad para estructurar tu conocimiento técnico, acelerar tus flujos de trabajo mediante RAG local y potenciar tus agentes de IA vía MCP, considera apoyar el desarrollo continuo:

<div align="center">

<a href="https://www.buymeacoffee.com/carlosNahuelSanchez" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="48" />
</a>

</div>

---

<div align="center">

Hecho por el equipo de **[Nexus Studio](https://www.instagram.com/nexus.studio.dev/)**

</div>
