<!-- prettier-ignore -->
<div align="center">

<img src="./logo-animated.gif" alt="NexoNotes Logo" height="100" />

# NexoNotes

*Technical Document Management, Local RAG Engine & MCP Server*

[![Spanish Documentation](https://img.shields.io/badge/Language-Español-red.svg)](README.md)
[![License: PolyForm Noncommercial](https://img.shields.io/badge/License-NonCommercial_Open_Source-green.svg)](LICENSE.md)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-24%2B-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![MCP](https://img.shields.io/badge/MCP-Server-00FF66?style=flat-square&logo=anthropic&logoColor=black)](https://modelcontextprotocol.io/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E7CC3?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

[Overview](#overview) • [Architecture](#architecture) • [Ports](#ports) • [Quick Start](#quick-start) • [CLI Commands](#cli-commands) • [MCP Integration](#mcp-integration) • [User Guide](#user-guide) • [API Reference](#api-reference) • [Structure](#project-structure) • [License](#license)

</div>

---

## Overview

**NexoNotes** is an autonomous, self-hosted technical document management system with an integrated **Retrieval-Augmented Generation (RAG)** engine and a native **Model Context Protocol (MCP)** server, fully containerized via Docker.

It stores all notes locally in PostgreSQL and computes 768-dimensional vector embeddings with `pgvector`. It lets you organize your technical knowledge base, query it via an interactive assistant with citations, and connect it directly to external AI agents (Antigravity, Cursor, Claude Desktop, Claude Code, Windsurf, OpenCode).

---

## Architecture

```
[ Web Browser ]                        [ External AI Agents ]
       │                         (Antigravity / Cursor / Claude / etc.)
       ▼ (Port 3780)                           │
[ Frontend: React + Nginx ]                    ▼ (Port 8781)
       │                                [ MCP Server ]
       ▼ (Internal Proxy /api/)                │
[ Backend: FastAPI ] ──────────────────────────┤
       │                                       │
       ▼                                       ▼
[ PostgreSQL 16 + pgvector ] ────────► [ Gemini API ]
  - notes (content & metadata)           (Embeddings & RAG)
  - embeddings (768d Vector + HNSW)
```

- **PostgreSQL 16 + pgvector:** Relational database and vector store with an HNSW index for fast semantic search.
- **Backend API (FastAPI):** MarkItDown ingestion, RAG generation, workspace exports, and webhooks.
- **MCP Server (Port 8781):** Exposes tools to external AI agents over HTTP and SSE.
- **Frontend SPA (React 18 + TS):** Note manager, RAG assistant console, and system telemetry.

---

## Ports

| Service | Endpoint | Description |
| :--- | :--- | :--- |
| **Frontend** | `http://localhost:3780` | Web user interface |
| **Backend API** | `http://localhost:8780` | REST API & RAG streaming |
| **API Documentation** | `http://localhost:8780/docs` | Interactive Swagger / OpenAPI |
| **MCP Server** | `http://localhost:8781/sse` | MCP agent connection endpoint |
| **PostgreSQL** | `localhost:5432` | Relational & vector database |

---

## Prerequisites

- **Docker Engine** 24.0+ and **Docker Compose** v2.0+
- **Python 3.10+** (for global CLI commands)
- **Google Gemini API Key** (`GEMINI_API_KEY`)

---

## Quick Start

### 1. Clone repository & configure environment

```bash
git clone https://github.com/carlosNahuelSanchez/NexoNotes.git
cd NexoNotes
cp .env.example .env
```

Edit `.env` and add your `GEMINI_API_KEY`:

```env
GEMINI_API_KEY=your_gemini_key_here
POSTGRES_DB=nexonotes_db
POSTGRES_USER=nexonotes_admin
POSTGRES_PASSWORD=nexonotes_secure_pass
POSTGRES_PORT=5432
BACKEND_PORT=8780
FRONTEND_PORT=3780
LLM_MODEL=gemini-3.5-flash-lite
WEBHOOK_URL=
```

### 2. Install CLI and start services

```bash
# Register nexonotes globally in your system PATH
nexonotes install

# Build and start all services
nexonotes start
```

Access the application in your browser at **`http://localhost:3780`**.

---

## CLI Commands

| Command | Description |
| :--- | :--- |
| `nexonotes install` | Registers `nexonotes` globally in your system PATH |
| `nexonotes start` | Builds images and starts all containers in the background |
| `nexonotes stop` | Gracefully stops containers while preserving database volumes |
| `nexonotes status` | Checks the status of running containers |
| `nexonotes logs` | Streams live logs from all containers in real time |
| `nexonotes mcp-auto` | Interactive assistant to inject MCP config into your agents |
| `nexonotes mcp-list` | Lists detected agents and their MCP connection status |

---

## MCP Integration

The server running on port `8781` exposes your local knowledge base so developer tools and AI agents can query and manage notes.

### Available Tools

| Tool | Parameters | Description |
| :--- | :--- | :--- |
| `search_notes` | `query, top_k=4` | Semantic vector search using cosine similarity |
| `get_note` | `note_id` | Retrieves full Markdown content and metadata for a note |
| `list_notes` | `folder?, tag?` | Lists notes filtered by folder or tag |
| `create_note` | `title, content, folder?, tags?` | Creates a note and automatically indexes its embedding |
| `list_folders` | *none* | Lists all existing folders in the workspace |
| `ask_nexo` | `question, top_k=4` | Runs local RAG and returns an answer with citations |

### Automatic Configuration

Run the interactive setup tool from any terminal:

```bash
nexonotes mcp-auto
```

Supports 1-click configuration for:
1. **Antigravity** (`~/.gemini/config/mcp_config.json`)
2. **Cursor** (`.cursor/mcp.json`)
3. **Claude Desktop** (`claude_desktop_config.json`)
4. **Windsurf** (`~/.codeium/windsurf/mcp_config.json`)
5. **Claude Code** (`~/.claude.json`)
6. **OpenCode** (`~/.config/opencode/opencode.json`)

### Manual Configuration

For any other MCP-compatible client:

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

## User Guide

### 1. Note & Folder Management
- **Creation:** Use `+ NOTA` or `+ CARPETA` buttons (or shortcuts `Alt+N` / `Alt+F`).
- **Organization:** Real IDE-style tree supporting drag & drop for notes and folders.
- **Search:** Search across note content, titles, or `#tag` filters; matching folders auto-expand.
- **Editing:** Split-view Markdown editor with live preview and syntax highlighting.

### 2. Ingestion & Export
- **Import:** Drag files into the browser. Supports `.md`, `.txt`, `.pdf`, `.docx`, and `.zip` archives (automatic MarkItDown conversion).
- **Export:** Export individual `.md` files, folders as `.zip`, or the entire repository as structured **JSON** or **CSV/Excel**.

### 3. Nexo RAG Console
- Switch to the `[2] NEXO` tab.
- Query your knowledge base to receive answers synthesized by Gemini with direct citation links to source notes.

### 4. System Statistics
- Access via the bar chart icon in the header (or `F3`).
- Displays total notes, folders, tags, vector embedding coverage, database latency, and recent activity.

---

## API Reference

### Core Endpoints (Port 8780)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` / `/api/stats` | System telemetry, vector coverage, and activity stats |
| `GET` | `/api/notes` | Lists notes with search, tag, and folder filters |
| `POST` | `/api/notes` | Creates note and computes `pgvector` embedding |
| `PUT` | `/api/notes/{id}` | Updates note and updates embedding |
| `DELETE` | `/api/notes/{id}` | Deletes note and vector embedding |
| `POST` | `/api/notes/import` | Ingests and converts documents to Markdown |
| `GET` | `/api/notes/{id}/export` | Downloads individual note in `.md` |
| `GET` | `/api/notes/export/all` | Full workspace export in JSON or CSV (`?format=json\|csv`) |
| `GET` | `/api/notes/folders` | Lists active folders |
| `GET` | `/api/notes/tags` | Lists active tags |
| `GET` | `/api/nexo/stream` | Real-time SSE streaming for RAG answers |

### MCP Endpoints (Port 8781)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/sse`, `/mcp`, `/` | JSON-RPC initialization and tool dispatch |
| `GET` | `/sse` | Server-Sent Events stream |
| `POST` | `/messages/` | JSON-RPC message delivery for SSE sessions |

---

## Project Structure

```
NexoNotes/
├── docker-compose.yml    # Service orchestration (db, backend, frontend, mcp)
├── .env.example          # Environment variables template
├── nexonotes             # Entry script for Linux / macOS
├── nexonotes.bat         # Entry script for Windows CMD
├── README.md             # Documentation in Spanish
├── README_en.md          # Documentation in English
├── backend/              # FastAPI API, pgvector, and RAG engine
│   ├── app/
│   │   ├── main.py       # API routes and health endpoints
│   │   ├── mcp_server.py # Standalone MCP server
│   │   ├── database.py   # SQLAlchemy session and pgvector
│   │   ├── models.py     # Database schema and vector models
│   │   ├── routers/      # Modular note and RAG routers
│   │   └── services/     # Gemini RAG, MarkItDown, and Webhooks
│   └── Dockerfile
├── frontend/             # React 18 + TypeScript SPA
│   ├── src/
│   │   ├── App.tsx       # Root component with tab persistence
│   │   ├── components/   # File tree, editor, Nexo console, etc.
│   │   └── index.css     # Global stylesheets
│   └── Dockerfile
└── scripts/              # CLI helpers and MCP configuration
    ├── nexonotes.py      # Core CLI engine
    ├── setup-mcp.bat     # Windows launcher
    └── setup-mcp.sh      # Unix launcher
```

---

## License

This project is open-source software released under the **[PolyForm Noncommercial License 1.0.0](LICENSE.md)**. Personal, educational, research, and internal organizational use is permitted. Direct commercial resale is strictly prohibited.

---

<div align="center">

Built with care by the team at **[Nexus Studio](https://www.instagram.com/nexus.studio.dev/)**

</div>
