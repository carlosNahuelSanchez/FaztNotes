<!-- prettier-ignore -->
<div align="center">

<img src="./logo-animated.gif" alt="NexoNotes Logo" height="100" />

# NexoNotes

*Private & Autonomous Technical Document Management and RAG System*

[![Spanish Documentation](https://img.shields.io/badge/Language-Español-red.svg)](README.md)
[![License: PolyForm Noncommercial](https://img.shields.io/badge/License-NonCommercial_Open_Source-green.svg)](LICENSE.md)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-24%2B-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E7CC3?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

[Overview](#overview) • [Architecture](#architecture) • [System Ports](#system-ports) • [Prerequisites](#prerequisites) • [Quick Start](#quick-start) • [CLI Commands](#cli-commands) • [Key Features](#key-features) • [User Manual](#user-manual--practical-guide) • [API Reference](#api-reference) • [License](#license)

</div>

---

> [!NOTE]
> **Spanish Documentation:** The default primary documentation in Spanish is located at [README.md](README.md).

---

## Overview

**NexoNotes** is an autonomous, self-hosted technical document management system with an integrated **Retrieval-Augmented Generation (RAG)** engine containerized via Docker.

Designed specifically for developers and software engineers, NexoNotes stands out as an **ultra-fast, minimalist, and highly efficient** tool featuring a **TERMINAL, CLI, OR IDE aesthetic**. It allows you to centralize, organize, and query your technical knowledge base instantly and privately without delegating vector storage to third-party cloud platforms.

> [!IMPORTANT]
> All notes are stored locally in PostgreSQL and automatically vectorized into 768-dimensional embeddings using `pgvector`. Your data stays 100% under your control, while AI queries are answered strictly using text retrieved from your notes.

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

- **Database & Vector Storage:** PostgreSQL 16 with `pgvector` extension and HNSW index for high-speed semantic search.
- **Backend API:** FastAPI (Python 3.11), SQLAlchemy 2.0, Microsoft MarkItDown, and real-time SSE streaming.
- **Frontend SPA:** React 18, TypeScript, and Tailwind CSS served by Nginx.
- **Orchestration:** Multi-container deployment managed via Docker Compose.

---

## System Ports

| Service | Endpoint | Description |
| :--- | :--- | :--- |
| **Frontend UI** | `http://localhost:3780` | Technical note management UI & Nexo Console |
| **Backend API** | `http://localhost:8780` | REST API endpoints & SSE streaming |
| **API Documentation** | `http://localhost:8780/docs` | Interactive OpenAPI / Swagger documentation |
| **PostgreSQL** | `localhost:5432` | Relational database & `pgvector` vector store |

---

## Prerequisites

- **Docker Engine** 24.0+ and **Docker Compose** v2.0+
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

Edit the `.env` file and enter your Google Gemini API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key
POSTGRES_DB=nexonotes_db
POSTGRES_USER=nexonotes_admin
POSTGRES_PASSWORD=nexonotes_secure_pass
POSTGRES_PORT=5432
BACKEND_PORT=8780
FRONTEND_PORT=3780
LLM_MODEL=gemini-3.5-flash-lite
```

### 3. Register the Global CLI Command

```bash
# Linux / macOS / Git Bash:
./nexonotes install

# Windows PowerShell:
.\nexonotes.ps1 install
```

### 4. Start the System

```bash
nexonotes start
```

Access the web interface at **`http://localhost:3780`**.

---

## CLI Commands

| Command | Description |
| :--- | :--- |
| `nexonotes start` | Builds images and starts containers in the background |
| `nexonotes stop` | Gracefully stops containers while preserving data volumes |
| `nexonotes logs` | Streams combined container logs in real time |
| `nexonotes install` | Configures CLI execution globally on your system |

---

## Key Features

- **Hierarchical Explorer & Drag & Drop:** IDE-style real file tree supporting note/folder dragging (including dropping to root `/` or directly from your OS file manager).
- **Full Management & Editing:** Real-time creation, deletion, copy/paste, and inline renaming (`Alt+R` or `...` menu) with database persistence.
- **Search & Multi-Tag Filter:** Autonomous search across titles, content, and multiple tags (`#tag`) with automatic folder expansion.
- **Markdown Reader & Editor:** Full-screen reading mode, interactive editor with live split preview, code syntax highlighting, and LaTeX rendering.
- **Smart Import (MarkItDown):** Support for `.md`, `.txt`, Word (`.docx`), PDF (`.pdf`), and `.zip` archives with automated conversion via Microsoft MarkItDown.
- **Nexo AI Console (Local RAG):** Real-time token-by-token SSE responses grounded strictly with citations `[Source: Title (ID)]` over vectors in `pgvector`.
- **System Status Line & Global Shortcuts:** Color-coded status updates (`[SYSTEM]`) and shortcuts (`F1`, `F2`, `Alt+N`, `Alt+F`, `Alt+R`, `Del`, `Ctrl+C`/`Ctrl+V`).

---

## User Manual / Practical Guide

### 1. Navigation & File Operations
- **Create:** Use `+ NOTE` and `+ FOLDER` buttons or `Alt+N` and `Alt+F` shortcuts.
- **Rename:** Select a note or folder and press `Alt+R` or use the `...` menu.
- **Search:** Type any term in the search box; matching folders will expand automatically.
- **Clipboard:** Use `Ctrl+C` to copy and `Ctrl+V` to paste items into folders or root.

### 2. Import & Conversion
- Click the import button in the toolbar or drag files directly from your OS.
- Word and PDF files are converted to Markdown automatically by **Microsoft MarkItDown**.

### 3. Nexo AI Assistant
- Switch to tab `[2] NEXO CONSOLE`.
- Ask technical questions to receive grounded answers generated directly from your notes with citations.

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | System health check (PostgreSQL, Gemini AI, total notes) |
| `GET` | `/api/notes` | List notes with optional `search`, `tag`, and `folder` filters |
| `POST` | `/api/notes` | Create note with instant `pgvector` indexing |
| `POST` | `/api/notes/import` | Import and convert `.md`, Word, PDF, and ZIP files |
| `GET` | `/api/notes/{id}/export` | Download note in Markdown (`.md`) format |
| `GET` | `/api/notes/export/folder` | Export folders or entire workspace as `.zip` archive |
| `PUT` | `/api/notes/{id}` | Update note content and re-generate embedding |
| `PUT` | `/api/notes/folder/rename` | Rename folder and update note paths in PostgreSQL |
| `DELETE` | `/api/notes/{id}` | Delete note and vector index |
| `DELETE` | `/api/notes/folder` | Delete entire folder with all contained notes and subfolders |
| `GET` | `/api/notes/folders` | Retrieve list of active folders |
| `GET` | `/api/notes/tags` | Retrieve list of registered tags |
| `GET` | `/api/nexo/stream` | Stream real-time RAG answers via SSE |

---

## Project Structure

```
NexoNotes/
├── LICENSE.md            # PolyForm Noncommercial 1.0.0 License
├── .env.example          # Environment variables template
├── docker-compose.yml    # Multi-container orchestration (db, backend, frontend)
├── nexonotes             # Executable CLI script for Linux / macOS / Git Bash
├── nexonotes.ps1         # Executable CLI script for Windows PowerShell
├── nexonotes.cmd         # Executable launcher for Windows CMD
├── README.md             # Primary documentation in Spanish
├── README_en.md          # English documentation
├── backend/              # FastAPI service with pgvector, MarkItDown & RAG pipeline
└── frontend/             # SPA React + TypeScript served by Nginx
```

---

## License

This project is open-source software under the terms of the **[PolyForm Noncommercial License 1.0.0](LICENSE.md)**.

- **Permitted Use:** You are free to download, compile, study, modify, adapt, and distribute this project for personal, educational, research, or internal management purposes.
- **Commercial Restriction:** Selling, sublicensing, reselling, or commercializing this software or its derivatives as a closed commercial product for direct profit is strictly prohibited.

---

## Support the Project

If **NexoNotes** streamlines your technical documentation and enhances your productivity with private local RAG, consider supporting ongoing development and the creation of future open-source tools.

<div align="center">

<a href="https://www.buymeacoffee.com/carlosNahuelSanchez" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="48" />
</a>

</div>

---

<div align="center">

Made by the team at **[Nexus Studio](https://www.instagram.com/nexus.studio.dev/)**

</div>
