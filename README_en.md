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

**NexoNotes** is an autonomous, self-hosted technical document management system with an integrated **Retrieval-Augmented Generation (RAG)** engine containerized via Docker, created by the team at **Nexus Studio**.

Designed specifically for developers, software engineers, sysadmins, and technical leads, NexoNotes stands out as an **ultra-fast, minimalist, and highly efficient** tool featuring a refined technical aesthetic inspired by **TERMINAL, CLI, OR IDE** interfaces. Its high-information-density UI delivers a distraction-free experience focused on enriched plain-text Markdown while eliminating visual clutter and unnecessary graphics. It allows you to centralize, organize, and query your technical knowledge base instantly and privately with minimal latency, without delegating data storage or embeddings to third-party cloud vector platforms.

> [!IMPORTANT]
> All notes are stored locally in PostgreSQL and automatically vectorized into 768-dimensional embeddings using `pgvector`. Your data stays 100% under your control, while AI queries are answered strictly and grounded using only text retrieved from your notes.

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
- **Backend API:** FastAPI (Python 3.11) using SQLAlchemy 2.0, Microsoft MarkItDown, and Server-Sent Events (SSE) streaming. Handles instant vector indexing upon note creation and updates.
- **Frontend SPA:** React 18 with TypeScript and Tailwind CSS featuring a high-density, monochrome terminal interface served by Nginx.
- **Orchestration:** Multi-container deployment managed via Docker Compose.

---

## System Ports

To avoid conflicts with local development environments, NexoNotes operates on the following default ports:

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
git clone https://github.com/carlosNahuelSanchez/NexoNotes.git
cd NexoNotes
```

### 2. Configure Environment Variables

Copy the example environment configuration:

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

Register the `nexonotes` command globally to execute it from any terminal:

- **Linux / macOS / Git Bash:**
  ```bash
  ./nexonotes install
  ```

- **Windows PowerShell:**
  ```powershell
  .\nexonotes.ps1 install
  ```

> [!IMPORTANT]
> The installation script automatically detects your OS environment and adds the command path to your system `PATH` or shell profile (`~/.bashrc`, `$PROFILE`).

### 4. Start the System

Run the global CLI command to build and start the containers:

```bash
nexonotes start
```

Access the web interface at **`http://localhost:3780`**.

---

## CLI Commands

The `nexonotes` CLI simplifies container management across Linux, macOS, and Windows:

| Command | Description |
| :--- | :--- |
| `nexonotes start` | Builds images (if needed), starts containers in background, and checks backend health |
| `nexonotes stop` | Gracefully stops and removes containers while preserving persistent data volumes |
| `nexonotes logs` | Attaches and streams combined container logs in real time (`Ctrl+C` to exit) |
| `nexonotes install` | Configures shell profile or system `PATH` to run the CLI globally |

---

## Key Features

### 1. Technical Document Management (Terminal / IDE Aesthetic)
- **IDE-Style Hierarchical Explorer:** Real file tree without artificial folders. Root notes render directly in the root directory.
- **Drag & Drop to Root:** Drag notes or folders anywhere across the tree area. Dropping onto the emerald green highlighted area moves items directly to the root (`/`).
- **Autonomous Global Search:** Searches titles, content, and tags simultaneously. Typing a query automatically expands all matching folders and hides non-matching ones.
- **Multi-Tag Filtering:** Select multiple tags (`#tag`) at the same time with instant updates and a "ALL" reset button.
- **3-Dots Context Menu (`...`):** Every note and folder includes a 3-dots menu for quick open, copy, export, and delete actions.
- **Transparent Vectorization:** Vector indexing in pgvector runs seamlessly. If an API error occurs, a bright red alert banner explains the exact issue.

### 2. Markdown Reader & Editor
- **Full-Screen Reader:** Selecting a note opens it immediately in full-screen Markdown reading mode.
- **Interactive Editor:** `[EDIT]` button with mode switcher (`Edit`, `Split`, `Preview`).
- **Technical Rendering:** Code syntax highlighting, tables, lists, and LaTeX math formulas.

### 3. Smart Import with Microsoft MarkItDown
- **Format Support:** Import Markdown (`.md`, `.txt`), Word (`.docx`), PDF (`.pdf`), or `.zip` archives.
- **Microsoft MarkItDown Engine:** Integrates official **[Microsoft MarkItDown](https://github.com/microsoft/markitdown)** to convert PDF and Word files into clean Markdown.
- **ZIP Verification:** Inspects imported ZIP archives, filtering out unsupported files (images, PPTX) with an explicit warning banner.

> [!WARNING]
> **Automated Conversion Note (Microsoft MarkItDown):**
> Document conversion from Word (`.docx`) and PDF (`.pdf`) to Markdown is handled automatically by **Microsoft MarkItDown**. Due to complex binary formats, automated conversion may occasionally produce minor formatting inaccuracies in complex tables or advanced layouts. You can easily refine any imported note using the built-in Markdown editor.

### 4. Exporting & Backups
- **Single Note Download (.md):** Export any note directly to a native `.md` file.
- **Folder & Workspace Archiving (ZIP):** Export individual folders or your entire workspace into structured `.zip` archives.

### 5. Nexo Executive AI Console (RAG Engine)
- **Real-Time SSE Streaming:** Token-by-token response generation.
- **ASCII Welcome Banner:** High-tech terminal aesthetic with cyber decoding tooltips.
- **Grounded Answers:** Strict citations for every statement (`[Source: Title (ID)]`).
- **Context Notes Parameter Control:** Adjust retrieved context depth with help tooltips (`?`).
- **Tuned Temperature (0.3):** Balanced creative explanation with factual accuracy.
- **Nexus Studio Knowledge:** Nexo acknowledges its purpose and credits its creation to **Nexus Studio**.

### 6. Permanent System Status Line & Shortcuts
- **Permanent System Line (`[SYSTEM]`):** Always visible line reporting real-time status:
  - **Loading:** Grey pulse (`[SYSTEM: CARGANDO]`).
  - **Success:** Emerald green (`[SYSTEM: OK]`).
  - **Error:** Red (`[SYSTEM: FALLO]`).
  - Automatically clears after 5 seconds using a matrix/cyber glitch wipe animation.
- **Keyboard Shortcuts:**
  - `[F1]`: Switch to Notes Explorer
  - `[F2]`: Switch to Nexo Console
  - `[ALT+N]`: New note
  - `[ALT+F]`: New folder
  - `[SUPR] / [DELETE]`: Delete selected item
  - `[CTRL+C] / [CTRL+V]`: Copy and paste items
- **Source Code Access:** Footer button with official GitHub icon linking directly to the repository.

---

## User Manual / Practical Guide

### 1. Navigation & File Operations
- **Create:** Use `+ NOTE` and `+ FOLDER` buttons in the explorer toolbar.
- **Search:** Type in the search box to automatically open matching folders.
- **Drag to Root:** Drop items onto the green highlighted tree area to move them to the root.
- **Clipboard:** Press `Ctrl+C` to copy any item and `Ctrl+V` to paste it into a folder or root.

### 2. Import & Conversion
- Click the import button in the toolbar or inside any folder.
- Select `.md`, `.docx`, `.pdf`, or `.zip` files.
- MarkItDown converts Word/PDF to Markdown automatically.

### 3. Nexo AI Console
- Switch to tab `[2] NEXO CONSOLE`.
- Ask any technical question. Nexo answers grounded strictly on your notes with citations.
- Adjust `CONTEXT NOTES` to control retrieval depth.

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | System health check (PostgreSQL, Gemini AI, total notes) |
| `GET` | `/api/notes` | List notes with optional `search`, `tag`, and `folder` filters |
| `POST` | `/api/notes` | Create note with instant `pgvector` indexing |
| `POST` | `/api/notes/import` | Import and convert `.md`, Word, PDF, and ZIP files via MarkItDown |
| `GET` | `/api/notes/{id}/export` | Download note in Markdown (`.md`) format |
| `GET` | `/api/notes/export/folder` | Export folders or entire workspace as `.zip` archive |
| `PUT` | `/api/notes/{id}` | Update note content and re-generate embedding |
| `DELETE` | `/api/notes/{id}` | Delete note and vector index |
| `DELETE` | `/api/notes/folder` | Delete entire folder with all contained notes and subfolders |
| `GET` | `/api/notes/folders` | Retrieve list of active folders |
| `GET` | `/api/notes/tags` | Retrieve list of registered tags |
| `GET` | `/api/nexo/stream` | Stream real-time RAG answers via SSE |
| `POST` | `/api/nexo/query` | Synchronous endpoint for RAG queries |

---

## Project Structure

```
NexoNotes/
├── LICENSE.md            # PolyForm Noncommercial 1.0.0 Open Source License
├── .env.example          # Environment variables template
├── docker-compose.yml    # Multi-container orchestration (db, backend, frontend)
├── nexonotes             # Executable CLI script for Linux / macOS / Git Bash
├── nexonotes.ps1         # Executable CLI script for Windows PowerShell
├── nexonotes.cmd         # Executable launcher for Windows CMD
├── logo-animated.gif     # Official animated logo
├── logo.png              # Official system logo
├── README.md             # Primary documentation in Spanish
├── README_en.md          # English documentation
├── backend/              # FastAPI service with pgvector, MarkItDown & RAG pipeline
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
└── frontend/             # SPA React + TypeScript served by Nginx
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── App.tsx
        ├── api.ts
        ├── i18n.ts
        ├── types.ts
        └── components/
            ├── AsciiNexo.tsx
            ├── CyberIcons.tsx
            ├── CyberTooltip.tsx
            ├── FolderTree.tsx
            ├── Header.tsx
            ├── MarkdownEditor.tsx
            ├── MarkdownView.tsx
            ├── NexoConsole.tsx
            ├── NoteEditor.tsx
            └── NotesManager.tsx
```

---

## License

This project is open-source software under the terms of the **[PolyForm Noncommercial License 1.0.0](LICENSE.md)**.

- **Permitted Use:** You are free to download, compile, study, modify, adapt, and distribute this project for personal, educational, research, or internal management purposes.
- **Commercial Restriction:** Selling, sublicensing, reselling, or commercializing this software or its derivatives as a closed commercial product for direct profit is strictly prohibited.

For custom licensing or enterprise inquiries, contact the team at **Nexus Studio**.

---

## Support the Project

If **NexoNotes** streamlines your technical documentation and enhances your productivity with private local RAG, consider supporting ongoing development and the creation of future open-source tools.

<div align="center">

<a href="https://www.buymeacoffee.com/carlosNahuelSanchez" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="48" />
</a>

<script type="text/javascript" src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js" data-name="bmc-button" data-slug="carlosNahuelSanchez" data-color="#000000" data-emoji="" data-font="Poppins" data-text="Buy me a coffee" data-outline-color="#ffffff" data-font-color="#ffffff" data-coffee-color="#FFDD00"></script>

</div>

---

<div align="center">

Made by the team at **Nexus Studio**

</div>

