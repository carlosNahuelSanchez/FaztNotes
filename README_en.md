<!-- prettier-ignore -->
<div align="center">

<img src="./logo-animated.gif" alt="NexoNotes Logo" height="100" />

# NexoNotes

*Private & Autonomous Technical Document Management, Local RAG Engine & MCP Server*

[![Spanish Documentation](https://img.shields.io/badge/Language-Español-red.svg)](README.md)
[![License: PolyForm Noncommercial](https://img.shields.io/badge/License-NonCommercial_Open_Source-green.svg)](LICENSE.md)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-24%2B-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![MCP](https://img.shields.io/badge/MCP-Dual_Transport-00FF66?style=flat-square&logo=anthropic&logoColor=black)](https://modelcontextprotocol.io/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E7CC3?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

[Overview](#overview) • [Architecture](#architecture) • [System Ports](#system-ports) • [Prerequisites](#prerequisites) • [Quick Start](#quick-start) • [CLI Commands](#cli-commands) • [MCP Integration](#mcp-integration-model-context-protocol) • [System Statistics Dashboard](#system-statistics-dashboard) • [Key Features](#key-features) • [API Reference](#api-reference) • [License](#license)

</div>

---

> [!NOTE]
> **Spanish Documentation:** The default primary documentation in Spanish is located at [README.md](README.md).

---

## Overview

**NexoNotes** is an autonomous, private technical documentation management system featuring an integrated **Retrieval-Augmented Generation (RAG)** engine and a native **Model Context Protocol (MCP)** server, fully containerized via Docker.

Designed specifically for developers and software engineers, NexoNotes stands out with its **Hacker / Matrix CLI aesthetic**, lightning-fast response times, and the ability to bridge your local knowledge base both to an interactive built-in assistant and to external AI agents (such as Antigravity, Cursor, Claude Desktop, and Windsurf) via MCP.

> [!IMPORTANT]
> All notes are stored locally in PostgreSQL and automatically vectorized into 768-dimensional embeddings using `pgvector`. Your data remains 100% under your control without delegating vectors or documents to third-party cloud services.

---

## Architecture

```
[ Web Browser ]                        [ External AI Agents ]
       │                         (Antigravity / Cursor / Claude / Windsurf)
       ▼ (Port 3780)                           │
[ Frontend: React 18 + Nginx ]                 ▼ (Port 8781)
       │                              [ Hybrid MCP Server ]
       ▼ (Internal Proxy /api/)      (Streamable HTTP + Legacy SSE)
[ Backend: FastAPI (Python 3.11) ]             │
       │                                       │
       ├───────────────────────────────────────┘
       ▼
[ Database: PostgreSQL 16 + pgvector ] ───► [ AI Engine: Gemini API ]
    ├── notes (id, title, content, tags, ...)    (text-embedding / gemini-3.5-flash-lite)
    └── embedding (768d Vector + HNSW index)
```

- **Database & Vector Store:** PostgreSQL 16 with the `pgvector` extension and an HNSW cosine index for sub-millisecond semantic search.
- **Backend API:** FastAPI (Python 3.11), SQLAlchemy 2.0, Microsoft MarkItDown, workspace export (JSON/CSV), webhooks, and SSE streaming.
- **Dual-Transport MCP Server:** Standalone FastAPI/Starlette process running on port `8781` with concurrent support for **Streamable HTTP** (Antigravity, Gemini CLI) and **Legacy SSE** (Cursor, Claude Desktop, Windsurf).
- **Frontend SPA:** React 18, TypeScript, and Tailwind CSS with state persistence between tabs, system telemetry dashboard, and Matrix styling.
- **Orchestration:** Multi-container deployment managed via `docker compose` (4 healthy, isolated containers).

---

## System Ports

| Service | Endpoint | Description |
| :--- | :--- | :--- |
| **Frontend UI** | `http://localhost:3780` | Note manager, Nexo RAG console, and telemetry dashboard |
| **Backend API** | `http://localhost:8780` | REST API endpoints, analytics, and RAG streaming |
| **API Documentation** | `http://localhost:8780/docs` | Interactive OpenAPI / Swagger documentation |
| **MCP Server** | `http://localhost:8781/sse` | MCP protocol (Streamable HTTP & Legacy SSE) |
| **PostgreSQL** | `localhost:5432` | Relational database & `pgvector` vector store |

---

## Prerequisites

- **Docker Engine** 24.0+ and **Docker Compose** v2.0+
- **Python 3.10+** (for global CLI commands)
- **Google Gemini API Key** (`GEMINI_API_KEY`)

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/carlosNahuelSanchez/NexoNotes.git
cd NexoNotes
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Edit the `.env` file and insert your Google Gemini API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key
POSTGRES_DB=nexonotes_db
POSTGRES_USER=nexonotes_admin
POSTGRES_PASSWORD=nexonotes_secure_pass
POSTGRES_PORT=5432
BACKEND_PORT=8780
FRONTEND_PORT=3780
LLM_MODEL=gemini-3.5-flash-lite
WEBHOOK_URL=
```

### 3. Register the Global CLI Command

Install the `nexonotes` command to execute it globally from any folder in your operating system:

```bash
# Windows (CMD or PowerShell):
nexonotes install

# Linux / macOS / Git Bash:
./nexonotes install
```

### 4. Start the System

```bash
nexonotes start
```

Open the web interface at **`http://localhost:3780`**.

---

## CLI Commands

The NexoNotes CLI provides container orchestration and automated MCP agent setup:

| Command | Description |
| :--- | :--- |
| `nexonotes install` | Registers the `nexonotes` command into your OS global PATH |
| `nexonotes mcp-auto` | 1-click interactive assistant to inject NexoNotes MCP into your AI agents |
| `nexonotes mcp-list` | Lists supported agents and shows their current MCP connection status |
| `nexonotes start` | Builds container images and launches all 4 services in the background |
| `nexonotes stop` | Gracefully stops containers while keeping PostgreSQL data intact |
| `nexonotes logs` | Streams live combined logs from all active containers |

---

## MCP Integration (Model Context Protocol)

NexoNotes includes a native **Model Context Protocol (MCP)** server on port `8781` that exposes your local knowledge base so any AI agent can search, inspect, create notes, or prompt Nexo directly from within your IDE or agent shell.

### Hybrid Dual-Transport Architecture

Unlike standard MCP servers that trigger `405 Method Not Allowed` when modern clients initiate sessions via POST, NexoNotes provides a unified ASGI router with **two concurrent transports**:

1. **Streamable HTTP (`POST /sse`, `POST /mcp`, `POST /`):** Powers the modern MCP specification used by **Antigravity**, **Gemini CLI**, and next-generation agent frameworks.
2. **Legacy SSE (`GET /sse` + `POST /messages/`):** Maintains full compatibility with the classic SSE specification used by **Cursor**, **Claude Desktop**, and **Windsurf**.

### Tools Exposed to AI Agents

| Tool | Signature | Description |
| :--- | :--- | :--- |
| `search_notes` | `query: str, top_k: int = 4` | Semantic vector search across `pgvector` with cosine similarity scores |
| `get_note` | `note_id: str` | Retrieves full Markdown content and metadata for a specific note |
| `list_notes` | `folder: str?, tag: str?` | Lists up to 50 notes optionally filtered by folder or tag |
| `create_note` | `title, content, folder?, tags?` | Creates a new note and immediately computes and stores its vector embedding |
| `list_folders` | `None` | Returns the complete list of all existing folders |
| `ask_nexo` | `question: str, top_k: int = 4` | Executes local RAG retrieval and produces a cited technical answer |

### 1-Command Auto-Configuration

To configure your agents automatically, run from any terminal:

```bash
nexonotes mcp-auto
```

The script prompts you to select your target agent:
- `[1]` Antigravity (Global `~/.gemini/config/mcp_config.json`)
- `[2]` Cursor (`.cursor/mcp.json`)
- `[3]` Claude Desktop (`claude_desktop_config.json`)
- `[4]` Windsurf (`~/.codeium/windsurf/mcp_config.json`)
- `[5]` All of the above

To verify configuration status at any time:

```bash
nexonotes mcp-list
```

### Manual Configuration

If you prefer to configure your agent manually, add this block to your agent's config file:

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

## System Statistics Dashboard

Accessible via the bar chart icon `<BarChartIcon />` in the header (or keyboard shortcut `F3`), the telemetry dashboard delivers a complete overview of system health with technical square typography (`Chakra Petch` & `Share Tech Mono`) and Matrix styling:

- **Key Metrics:** Total notes, total folders, and total unique tags.
- **Vector Engine Health:** Vectorized notes in `pgvector` vs pending embeddings with visual progress percentage.
- **Infrastructure Status:** Real-time PostgreSQL latency (ms), Gemini API health, and MCP server status.
- **Folder & Tag Breakdown:** Dedicated panels with internal scrolling to cleanly handle hundreds of folders and tags.
- **Interactive 14-Day Activity Chart:**
  - Responsive bars with hover darkening showing complete date format (Day, Month, Year) and note count.
  - **Soft Floating Modal:** Clicking any bar opens a smooth modal popup displaying the notes created or updated on that specific date.
  - **Instant Navigation:** Clicking any note inside the popup switches immediately to `[1] NOTAS`, selects the note, and expands its folder in the directory tree.

---

## Key Features

- **Tab State Persistence:** Switch seamlessly between `[1] NOTAS`, `[2] NEXO`, `[3] STATS`, and the MCP modal without losing your current edit draft or folder expansion state.
- **Collapsed Folders by Default with Auto-Expansion:** Starts clean with all folders closed. Searching text or clicking any tag automatically expands parent folders containing matching notes.
- **Hierarchical Explorer & Drag & Drop:** Real IDE-style tree supporting note and folder reordering (including dropping to root `/` or directly from your OS desktop).
- **Smart MarkItDown Ingestion:** Drag and drop `.md`, `.txt`, Word (`.docx`), PDF (`.pdf`), and `.zip` archives with automated Markdown conversion.
- **Full Workspace Export:** Download individual Markdown (`.md`) files or export the entire repository as structured **JSON** or spreadsheet **Excel / CSV**.
- **Nexo RAG Assistant:** Real-time SSE token-by-token streaming answers grounded in your notes with verifiable citations `[Source: Title (ID)]`.
- **Webhook Integration:** Optional outbound webhook events (`POST`) sent to your configured `WEBHOOK_URL` whenever notes are created or edited.

---

## API Reference

### Notes & RAG Endpoints (Backend: Port 8780)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | System health check, PostgreSQL latency, Gemini, MCP status, and 14-day activity |
| `GET` | `/api/stats` | Alias endpoint for system telemetry and dashboard metrics |
| `GET` | `/api/notes` | Lists notes with optional `search`, `tag`, and `folder` filters |
| `POST` | `/api/notes` | Creates a note with immediate vector embedding and webhook dispatch |
| `POST` | `/api/notes/import` | Ingests and converts `.md`, Word, PDF, and ZIP files to Markdown |
| `GET` | `/api/notes/{id}/export` | Downloads an individual note in Markdown (`.md`) |
| `GET` | `/api/notes/export/folder` | Exports folders or the entire workspace as a `.zip` archive |
| `GET` | `/api/notes/export/all` | Full workspace export in **JSON** or **CSV/Excel** (`?format=json\|csv`) |
| `PUT` | `/api/notes/{id}` | Updates a note and regenerates its vector embedding |
| `PUT` | `/api/notes/folder/rename` | Renames a folder and updates all nested paths in PostgreSQL |
| `DELETE` | `/api/notes/{id}` | Deletes a note and its vector embedding |
| `DELETE` | `/api/notes/folder` | Deletes a folder recursively along with all contained notes |
| `GET` | `/api/notes/folders` | Lists all active folders |
| `GET` | `/api/notes/tags` | Lists all registered tags |
| `GET` | `/api/nexo/stream` | Streams RAG answers in real time via SSE |
| `POST` | `/api/webhooks/test` | Triggers a test outbound webhook notification |

### MCP Server Endpoints (Port 8781)

| Method | Endpoint | Transport | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/sse`, `/mcp`, `/` | Streamable HTTP | JSON-RPC initialization and tool dispatch (Antigravity, Gemini CLI) |
| `GET` | `/sse` | Legacy SSE | Traditional Server-Sent Events stream (Cursor, Claude Desktop) |
| `POST` | `/messages/` | Legacy SSE | JSON-RPC message delivery for active SSE sessions |
| `DELETE` | `/sse`, `/mcp` | Streamable HTTP | Session teardown and cleanup |

---

## Project Structure

```
NexoNotes/
├── LICENSE.md            # PolyForm Noncommercial 1.0.0 License
├── .env.example          # Environment variables template (GEMINI_API_KEY & WEBHOOK_URL)
├── docker-compose.yml    # Multi-container orchestration (db, backend, frontend, mcp)
├── nexonotes             # Entry script for Linux / macOS / Git Bash
├── nexonotes.bat         # Entry script for Windows CMD
├── nexonotes.cmd         # Global PATH wrapper for Windows CMD
├── nexonotes.ps1         # Executable script for Windows PowerShell
├── README.md             # Primary documentation in Spanish
├── README_en.md          # English documentation
├── backend/              # FastAPI service with pgvector, MarkItDown, and RAG pipeline
│   ├── app/
│   │   ├── main.py       # FastAPI application and telemetry health endpoints
│   │   ├── mcp_server.py # Dual-transport MCP server (Streamable HTTP + Legacy SSE)
│   │   ├── database.py   # SQLAlchemy session & pgvector HNSW indexing
│   │   ├── models.py     # Note model with Vector(768)
│   │   ├── routers/      # Modular note and RAG endpoints
│   │   └── services/     # Gemini RAG, MarkItDown conversion, and Webhooks
│   └── Dockerfile
├── frontend/             # React 18 + TypeScript SPA served by Nginx
│   ├── src/
│   │   ├── App.tsx       # Main application shell with tab state persistence
│   │   ├── components/
│   │   │   ├── FolderTree.tsx   # Collapsible folder tree with drag & drop
│   │   │   ├── NotesManager.tsx # Split-view editor with Markdown preview
│   │   │   ├── NexoConsole.tsx  # RAG terminal with citations and streaming
│   │   │   ├── SystemStats.tsx  # Telemetry dashboard and interactive activity chart
│   │   │   ├── McpModal.tsx     # Interactive modal with MCP connection guides
│   │   │   └── Header.tsx       # Matrix navigation bar
│   │   └── index.css     # Styling with Chakra Petch and Share Tech Mono fonts
│   └── Dockerfile
└── scripts/              # CLI automation tooling
    ├── nexonotes.py      # CLI engine for global installation and auto-MCP setup
    ├── setup-mcp.bat     # Windows quick MCP configuration launcher
    └── setup-mcp.sh      # Linux/macOS quick MCP configuration launcher
```

---

## License

This project is open-source and free software released under the **[PolyForm Noncommercial License 1.0.0](LICENSE.md)**.

- **Permitted Use:** You are free to download, build, inspect, modify, adapt, and distribute this project for personal, educational, research, or internal non-commercial purposes.
- **Commercial Restriction:** It is strictly prohibited to sell, sublicense, resell, or commercialize this software or its derivatives as a closed commercial product or service for direct profit.

---

## Support the Project

If **NexoNotes** helps you organize your technical documentation, accelerates your workflows via local RAG, and powers your AI agents through MCP, consider supporting continued open-source development:

<div align="center">

<a href="https://www.buymeacoffee.com/carlosNahuelSanchez" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="48" />
</a>

</div>

---

<div align="center">

Built with care by the team at **[Nexus Studio](https://www.instagram.com/nexus.studio.dev/)**

</div>
