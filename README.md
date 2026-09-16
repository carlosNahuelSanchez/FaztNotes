<!-- prettier-ignore -->
<div align="center">

<img src="./logo.png" alt="FaztNotes Logo" height="100" />

# FaztNotes

*Private & Autonomous Technical Document Management and RAG System*

[![Español](https://img.shields.io/badge/Language-Español-red.svg)](README.es.md)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-24%2B-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E7CC3?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

[Overview](#overview) • [Architecture](#architecture) • [System Ports](#system-ports) • [Prerequisites](#prerequisites) • [Quick Start](#quick-start) • [CLI Commands](#cli-commands) • [Key Features](#key-features) • [API Reference](#api-reference) • [Project Structure](#project-structure)

</div>

---

## Overview

**FaztNotes** is an autonomous, self-hosted technical document management system with an integrated **Retrieval-Augmented Generation (RAG)** engine containerized via Docker.

Designed specifically for software engineers, sysadmins, and technical leads, FaztNotes allows you to centralize, organize, and query your knowledge base privately without delegating data storage or embeddings to third-party cloud vector platforms.

> [!NOTE]
> All notes are stored locally in PostgreSQL and automatically vectorized into 768-dimensional embeddings using `pgvector`. Your data stays under your control, while AI queries are answered exclusively using text retrieved from your notes.

---

## Architecture

```
[ Web Browser ]
       │
       ▼ (Port 3780)
[ Frontend: React 18 + Nginx ]
       │
       ▼ (Internal Proxy /api/)
[ Backend: FastAPI (Python 3.11) ] ───► [ AI Engine: Gemini API ]
       │                                (text-embedding / gemini-3.5-flash-lite)
       ▼
[ Database: PostgreSQL 16 + pgvector ]
   ├── notes (id, title, content, tags, folder, created_at, updated_at)
   └── embedding (768d Vector with HNSW cosine index)
```

- **Database & Vector Storage:** PostgreSQL 16 with the `pgvector` extension. Stores 768-dimensional embeddings indexed via HNSW for high-speed cosine similarity search.
- **Backend API:** FastAPI (Python 3.11) using SQLAlchemy 2.0 with Server-Sent Events (SSE) streaming. Handles instant vector indexing upon note creation and updates.
- **Frontend SPA:** React 18 with TypeScript and Tailwind CSS featuring a high-density, monochrome terminal interface served by Nginx.
- **Orchestration:** Multi-container deployment managed via Docker Compose.

---

## System Ports

To avoid conflicts with local development environments, FaztNotes operates on the following default ports:

| Service | Endpoint | Description |
| :--- | :--- | :--- |
| **Frontend UI** | `http://localhost:3780` | Technical note management UI & Nexo Console |
| **Backend API** | `http://localhost:8780` | REST API endpoints & SSE streaming |
| **API Documentation** | `http://localhost:8780/docs` | Interactive OpenAPI / Swagger documentation |
| **PostgreSQL** | `localhost:5432` | Relational database & `pgvector` vector store |

> [!TIP]
> Port mappings can be customized in the `.env` file by overriding `FRONTEND_PORT`, `BACKEND_PORT`, and `POSTGRES_PORT`.

---

## Prerequisites

- **Docker Engine** 24.0+ and **Docker Compose** v2.0+
- **Google Gemini API Key** (`GEMINI_API_KEY`)

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/carlosNahuelSanchez/FaztNotes-Personal-RAG.git
cd FaztNotes-Personal-RAG
```

### 2. Configure Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env
```

*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Edit `.env` and set your Google Gemini API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key
POSTGRES_DB=faztnotes_db
POSTGRES_USER=faztnotes_admin
POSTGRES_PASSWORD=faztnotes_secure_pass
POSTGRES_PORT=5432
BACKEND_PORT=8780
FRONTEND_PORT=3780
LLM_MODEL=gemini-3.5-flash-lite
```

### 3. Install Global CLI Command

Register the `faztnotes` command globally so it can be executed from any terminal directory:

- **Linux / macOS / Git Bash:**
  ```bash
  ./faztnotes install
  ```

- **Windows PowerShell:**
  ```powershell
  .\faztnotes.ps1 install
  ```

> [!IMPORTANT]
> The installation script automatically detects your environment and appends the script location to your system `PATH` or shell profile (`~/.bashrc`, `$PROFILE`).

### 4. Start the System

Run the global CLI command to build and launch all containers:

```bash
faztnotes start
```

Access the Web UI at **`http://localhost:3780`**.

---

## CLI Commands

The `faztnotes` CLI simplifies container management across Linux, macOS, and Windows:

| Command | Description |
| :--- | :--- |
| `faztnotes start` | Builds images (if needed), starts containers in detached mode, and checks backend health |
| `faztnotes stop` | Gracefully stops and removes containers while preserving persistent volumes |
| `faztnotes logs` | Attaches and streams real-time combined container logs (`Ctrl+C` to exit) |
| `faztnotes install` | Configures shell profile / system `PATH` for global CLI execution |

---

## Key Features

### 1. Technical Document Management
- **Folder Tree Organization:** Create custom folder structures (`/backend`, `/architecture`, `/devops`) via the `+ FOLDER` button.
- **Drag & Drop:** Move notes into folders seamlessly without page reloads.
- **Dynamic Filtering:** Search notes by text, folder, or technical tags (`#tag`).
- **Vector Index Status:** Visual `[VECT]` indicators confirm when notes are indexed in vector memory.

### 2. IDE-Grade Markdown Editor
- **3 Editing Modes:** `Edit`, `Split` (side-by-side view), and `Preview`.
- **Synchronized Line Numbers:** Track line positions across edit and preview panels.
- **Syntax Highlighting:** Styled code blocks, emerald headers (`#`, `##`), amber inline code, quotes, and links.

### 3. Nexo AI Executive Assistant
- **Real-Time Streaming:** Continuous Server-Sent Events (SSE) token generation.
- **Grounded Responses:** Answers strictly using content retrieved from your notes with mandatory inline citations (`[Source: Title (ID)]`).
- **Retrieved Context Panel:** Inspect extracted note snippets along with calculated cosine similarity scores.
- **Latency Monitoring:** Displays total end-to-end query response time in milliseconds.
- **Top-K Control:** Dynamically adjust the number of context chunks retrieved for generation.

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | System health check (PostgreSQL status, AI engine connectivity, note count) |
| `GET` | `/api/notes` | List notes with optional `search`, `tag`, and `folder` filters |
| `POST` | `/api/notes` | Create a note and trigger instant `pgvector` indexing |
| `PUT` | `/api/notes/{id}` | Update note content and regenerate vector embedding |
| `DELETE` | `/api/notes/{id}` | Transactionally remove note content and its vector record |
| `GET` | `/api/notes/folders` | Retrieve list of active folder paths |
| `GET` | `/api/notes/tags` | Retrieve list of distinct tags across all notes |
| `GET` | `/api/nexo/stream` | Stream RAG assistant responses in real-time via SSE |
| `POST` | `/api/nexo/query` | Synchronous RAG query endpoint |

---

## Project Structure

```
fazt-notes/
├── .env.example          # Environment variables template
├── docker-compose.yml    # Multi-container orchestration (db, backend, frontend)
├── faztnotes             # Executable CLI script for Linux / macOS / Git Bash
├── faztnotes.ps1         # Executable CLI script for Windows PowerShell
├── faztnotes.cmd         # Command launcher for Windows CMD
├── logo.png              # Official system logo
├── backend/              # FastAPI service with pgvector & RAG pipeline
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── config.py
│       ├── database.py
│       ├── main.py
│       ├── models.py
│       ├── schemas.py
│       ├── routers/
│       └── services/
└── frontend/             # React + TypeScript SPA served by Nginx
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── App.tsx
        ├── api.ts
        ├── i18n.ts
        ├── types.ts
        └── components/
            ├── FolderTree.tsx
            ├── Header.tsx
            ├── MarkdownEditor.tsx
            ├── MarkdownView.tsx
            ├── NexoConsole.tsx
            ├── NoteEditor.tsx
            ├── NoteList.tsx
            └── NotesManager.tsx
```
