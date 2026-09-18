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

Designed specifically for developers, software engineers, sysadmins, and technical leads, NexoNotes stands out as an **ultra-fast, minimalist, and highly efficient** tool featuring a refined technical aesthetic inspired by **TERMINAL, CLI, OR IDE** interfaces. Its high-information-density UI delivers a distraction-free experience focused on enriched plain-text Markdown while eliminating visual clutter. It allows you to centralize, organize, and query your technical knowledge base instantly and privately with minimal latency, without delegating data storage or embeddings to third-party cloud vector platforms.

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
- **Backend API:** FastAPI (Python 3.11) using SQLAlchemy 2.0 with Server-Sent Events (SSE) streaming. Handles instant vector indexing upon note creation and updates.
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

Edit `.env` and set your Google Gemini API key:

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

### 3. Install Global CLI Command

Register the `nexonotes` command globally so it can be executed from any terminal directory:

- **Linux / macOS / Git Bash:**
  ```bash
  ./nexonotes install
  ```

- **Windows PowerShell:**
  ```powershell
  .\nexonotes.ps1 install
  ```

> [!IMPORTANT]
> The installation script automatically detects your environment and appends the script location to your system `PATH` or shell profile (`~/.bashrc`, `$PROFILE`).

### 4. Start the System

Run the global CLI command to build and launch all containers:

```bash
nexonotes start
```

Access the Web UI at **`http://localhost:3780`**.

---

## CLI Commands

The `nexonotes` CLI simplifies container management across Linux, macOS, and Windows:

| Command | Description |
| :--- | :--- |
| `nexonotes start` | Builds images (if needed), starts containers in detached mode, and checks backend health |
| `nexonotes stop` | Gracefully stops and removes containers while preserving persistent volumes |
| `nexonotes logs` | Attaches and streams real-time combined container logs (`Ctrl+C` to exit) |
| `nexonotes install` | Configures shell profile / system `PATH` for global CLI execution |

---

## Key Features

### 1. Technical Document Management
- **Hierarchical IDE-Style Explorer:** Real file tree without artificial folders; root notes appear directly in the root, and expanding a folder shows only its immediate subfolders and notes.
- **Fluid Drag & Drop:** Drag notes and folders to restructure your hierarchy instantly.
- **Dynamic Filtering:** Real-time textual search by title and filter by technical tags (`#tag`).
- **Transparent Vectorization with Diagnostics:** Indexing into pgvector occurs in the background. If any error occurs (Gemini token limits, quota limits, or API failure), an explicit red alert banner informs you of the exact reason.

### 2. Markdown Viewing & Editing
- **Full-Screen Reading Mode:** Selecting any note opens it completely in Markdown across the main panel for a distraction-free reading experience.
- **Interactive Editor:** Click `[EDIT]` to open the editor with `Edit`, `Split`, and `Preview` modes.
- **Auto-Close on Save:** Clicking `[SAVE NOTE]` automatically closes the editor and returns to the full Markdown rendered view with the changes applied.
- **Syntax Highlighting:** Styled code blocks, styled headers, blockquotes, and tables.

### 3. Smart Document Import & Validation (Microsoft MarkItDown)
- **Native Markdown & ZIP Support:** Directly imports individual files (`.md`, `.markdown`, `.txt`) or full directories packed in `.zip` archives while preserving directory structure.
- **Word & PDF Conversion with Microsoft MarkItDown:** Integrates the robust **[Microsoft MarkItDown](https://github.com/microsoft/markitdown)** library to transparently convert Word documents (`.docx`) and PDF files (`.pdf`) into clean, structured Markdown syntax.
- **Preventive File Validation:** When importing a ZIP archive, the system checks each file format. Any unsupported files (such as images `.png`/`.jpg` or PowerPoint presentations `.pptx`) are safely discarded, and a prominent warning banner lists all skipped files.
- **Instant Vector Indexing:** Imported documents are automatically ingested and vectorized into PostgreSQL (`pgvector`), making them immediately accessible to the Nexo Assistant.
- **Direct Folder Shortcuts:** Top toolbar `[IMPORT]` button and quick `+IMP` shortcuts on each folder header to ingest files directly into any hierarchy level.

### 4. Comprehensive Note & Folder Export
- **Individual Note Download (.md):** Click `[EXPORT MD]` in the reading header or `EXP` in the file explorer to download any note as a native Markdown file.
- **Folder Packaging in ZIP:** Export any folder including all its subfolders and converted `.md` notes while preserving hierarchy via the `EXP` button on each folder row.
- **Full Workspace Backup:** Click `ZIP` on the top explorer toolbar to download a complete archive of all notes and folders in the workspace.

### 5. Nexo AI Executive Assistant
- **Real-Time Streaming:** Continuous Server-Sent Events (SSE) token generation.
- **Animated ASCII Banner:** Welcome screen featuring an interactive ASCII decoder animation with high-tech terminal aesthetics.
- **Grounded Responses:** Answers strictly using content retrieved from your notes with mandatory inline citations (`[Source: Title (ID)]`).
- **Retrieved Context Panel:** Inspect extracted note snippets along with calculated cosine similarity scores.
- **Latency Monitoring:** Displays total end-to-end query response time in milliseconds.
- **Top-K Control:** Dynamically adjust the number of context chunks retrieved for generation.

---

## User Manual / Practical Guide

### 1. File Explorer & Folders (IDE Style)
- **Real Structure Without Faux Folders:** Notes created in the root display directly in the explorer (just like `.md` files in an IDE).
- **Hierarchical Navigation:** Expanding a folder only shows its direct child folders and files, keeping your view tidy and uncluttered.
- **Fast Creation:** Use `+ NOTE` or `+ FOLDER` on the explorer toolbar, or the direct `+NOTE` and `+SUB` buttons on any folder header to create items directly inside it.
- **Drag & Drop Organization:** Drag individual notes or entire folders to move them, or drop them onto `[MOVE TO ROOT /]` at the bottom of the tree.

### 2. Viewing & Editing Markdown Notes
- **Full Reading View:** Clicking any note opens it immediately in **Full Markdown Reading Mode**, occupying the entire main panel.
- **`[EDIT]` Button:** Opens the interactive editor with mode toggles (`Edit`, `Split`, `Preview`) and metadata fields (title, folder, tags).
- **`[SAVE NOTE]` Button:** Saves changes to PostgreSQL, regenerates embeddings, closes the editor, and renders the complete updated note.
- **Bright Red Failure Alerts:** If vectorization fails due to token limits or Gemini issues, a prominent **bright red system alert banner** will display the exact reason for the failure.

### 3. File Import (Markdown, Word, PDF & ZIP)
- **From Explorer Toolbar:** Click the `[IMPORT]` button to upload any local document or ZIP archive to the root directory.
- **Into Specific Folders:** Click the quick `+IMP` shortcut on any folder header to import and convert a document directly inside that folder.
- **Supported Formats:**
  - Markdown and plain text files (`.md`, `.markdown`, `.txt`).
  - Microsoft Word documents (`.docx`).
  - PDF documents (`.pdf`).
  - Compressed archives (`.zip`).
- **Conversion & Validation:** Valid notes and documents are converted to Markdown using **Microsoft MarkItDown**. If a ZIP file contains incompatible items (images, binaries, PPTX), they are discarded and reported on screen.

### 4. Exporting Notes & Folders (Download .md and .zip)
- **Export Note:** Click `[EXPORT MD]` in the reader view or `EXP` on a note row in the explorer to download its `.md` file.
- **Export Folder:** Click `EXP` on any folder header to download a `.zip` archive with all subfolders and notes.
- **Export All:** Click the `ZIP` button on the top explorer toolbar to download an archive of the entire workspace.

### 5. Using the Nexo Assistant (RAG Console)
- Switch to the **`[2] NEXO CONSOLE`** tab on the top bar.
- Enjoy the interactive ASCII decoder welcome banner.
- Ask technical questions in natural language about topics documented in your notes.
- Nexo responds with real-time token streaming, strictly grounding each statement with citations `[Source: Title (ID)]`.

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | System health check (PostgreSQL status, AI engine connectivity, note count) |
| `GET` | `/api/notes` | List notes with optional `search`, `tag`, and `folder` filters |
| `POST` | `/api/notes` | Create a note and trigger instant `pgvector` indexing |
| `POST` | `/api/notes/import` | Import and convert `.md`, Word (`.docx`), PDF and ZIP files to Markdown with format validation |
| `GET` | `/api/notes/{id}/export` | Download note as a Markdown (`.md`) file |
| `GET` | `/api/notes/export/folder` | Export folders or full workspace as a compressed archive (`.zip`) |
| `PUT` | `/api/notes/{id}` | Update note content and regenerate vector embedding |
| `DELETE` | `/api/notes/{id}` | Transactionally remove note content and its vector record |
| `DELETE` | `/api/notes/folder` | Delete an entire folder along with all child subfolders and notes |
| `GET` | `/api/notes/folders` | Retrieve list of active folder paths |
| `GET` | `/api/notes/tags` | Retrieve list of distinct tags across all notes |
| `GET` | `/api/nexo/stream` | Stream RAG assistant responses in real-time via SSE |
| `POST` | `/api/nexo/query` | Synchronous RAG query endpoint |

---

## Project Structure

```
NexoNotes/
├── LICENSE.md            # Non-Commercial Open Source License
├── .env.example          # Environment variables template
├── docker-compose.yml    # Multi-container orchestration (db, backend, frontend)
├── nexonotes             # Executable CLI script for Linux / macOS / Git Bash
├── nexonotes.ps1         # Executable CLI script for Windows PowerShell
├── nexonotes.cmd         # Command launcher for Windows CMD
├── logo-animated.gif     # Official animated logo
├── logo.png              # Official system logo
├── README.md             # Primary documentation (Spanish)
├── README_en.md          # English documentation
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
            ├── AsciiNexo.tsx
            ├── CyberIcons.tsx
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

This project is free and open-source software under the terms of the **[PolyForm Noncommercial License 1.0.0](LICENSE.md)**.

- **Permitted Use:** You are free to run, study, audit, modify, adapt, and distribute this project for personal, educational, academic, and internal evaluation purposes.
- **Commercial Restriction:** Selling, sublicensing, reselling, or commercializing this software or its derivatives as a closed commercial product or paid commercial service is strictly prohibited.

For corporate or commercial licensing inquiries, contact the team at **Nexus Studio**.

---

<div align="center">

Made by the team at **Nexus Studio**

</div>
