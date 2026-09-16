<!-- prettier-ignore -->
<div align="center">

<img src="./logo.png" alt="Logo de FaztNotes" height="100" />

# FaztNotes

*Sistema Autónomo y Privado de Gestión de Documentos Técnicos y Motor RAG*

[![English](https://img.shields.io/badge/Language-English-blue.svg)](README.md)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-24%2B-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E7CC3?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

[Descripción General](#descripción-general) • [Arquitectura](#arquitectura-del-sistema) • [Puertos del Sistema](#puertos-del-sistema) • [Requisitos Previos](#requisitos-previos) • [Inicio Rápido](#inicio-rápido) • [Comandos CLI](#comandos-cli) • [Características](#características-principales) • [Referencia de la API](#referencia-de-la-api) • [Estructura del Proyecto](#estructura-del-proyecto)

</div>

---

## Descripción General

**FaztNotes** es un sistema autónomo y privado de gestión de documentación técnica con un motor **RAG (Retrieval-Augmented Generation)** integrado y contenerizado mediante Docker.

Diseñado para ingenieros de software, administradores de sistemas y líderes técnicos, FaztNotes permite centralizar, organizar y consultar tu base de conocimiento en privado, sin delegar la persistencia de datos ni vectores a plataformas en la nube de terceros.

> [!NOTE]
> Todas las notas se almacenan localmente en PostgreSQL y se vectorizan automáticamente en embeddings de 768 dimensiones utilizando `pgvector`. Tus datos permanecen bajo tu control y las consultas de la IA se responden exclusivamente utilizando fragmentos extraídos de tus notas.

---

## Arquitectura del Sistema

```
[ Navegador Web ]
       │
       ▼ (Puerto 3780)
[ Frontend: React 18 + Nginx ]
       │
       ▼ (Proxy inverso interno /api/)
[ Backend: FastAPI (Python 3.11) ] ───► [ Motor IA: API Gemini ]
       │                                (text-embedding / gemini-3.5-flash-lite)
       ▼
[ Base de Datos: PostgreSQL 16 + pgvector ]
   ├── notes (id, title, content, tags, folder, created_at, updated_at)
   └── embedding (Vector 768d con índice HNSW cosine)
```

- **Base de Datos y Almacenamiento Vectorial:** PostgreSQL 16 con extensión `pgvector`. Almacena vectores de 768 dimensiones con índice HNSW para búsquedas semánticas de alta velocidad por similitud coseno.
- **Backend API:** FastAPI (Python 3.11), SQLAlchemy 2.0 y transmisiones en tiempo real mediante Server-Sent Events (SSE). Indexación vectorial inmediata en cada creación o edición.
- **Frontend SPA:** React 18, TypeScript y Tailwind CSS con interfaz estilo consola monocromática servida por Nginx.
- **Orquestación:** Despliegue multicontenedor gestionado mediante Docker Compose.

---

## Puertos del Sistema

Para evitar colisiones con entornos de desarrollo locales, FaztNotes opera en los siguientes puertos predeterminados:

| Servicio | Endpoint | Descripción |
| :--- | :--- | :--- |
| **Interfaz Frontend** | `http://localhost:3780` | Panel de gestión de notas y consola Nexo |
| **Backend API** | `http://localhost:8780` | Endpoints REST y transmisión SSE |
| **Documentación API** | `http://localhost:8780/docs` | Interfaz interactiva OpenAPI / Swagger |
| **PostgreSQL** | `localhost:5432` | Base de datos relacional y almacén vectorial `pgvector` |

> [!TIP]
> Los puertos asignados se pueden personalizar en el archivo `.env` modificando las variables `FRONTEND_PORT`, `BACKEND_PORT` y `POSTGRES_PORT`.

---

## Requisitos Previos

- **Docker Engine** 24.0+ y **Docker Compose** v2.0+
- **Clave de API de Google Gemini** (`GEMINI_API_KEY`)

---

## Inicio Rápido

### 1. Clonar el Repositorio

```bash
git clone https://github.com/carlosNahuelSanchez/FaztNotes-Personal-RAG.git
cd FaztNotes-Personal-RAG
```

### 2. Configurar Variables de Entorno

Copia la plantilla de configuración de variables de entorno:

```bash
cp .env.example .env
```

*(En Windows PowerShell: `Copy-Item .env.example .env`)*

Edita el archivo `.env` e ingresa tu clave de API de Google Gemini:

```env
GEMINI_API_KEY=tu_clave_real_de_gemini
POSTGRES_DB=faztnotes_db
POSTGRES_USER=faztnotes_admin
POSTGRES_PASSWORD=faztnotes_secure_pass
POSTGRES_PORT=5432
BACKEND_PORT=8780
FRONTEND_PORT=3780
LLM_MODEL=gemini-3.5-flash-lite
```

### 3. Registrar el Comando Global CLI

Registra el comando `faztnotes` de forma global para ejecutarlo desde cualquier terminal:

- **Linux / macOS / Git Bash:**
  ```bash
  ./faztnotes install
  ```

- **Windows PowerShell:**
  ```powershell
  .\faztnotes.ps1 install
  ```

> [!IMPORTANT]
> El script de instalación detecta automáticamente tu entorno y agrega la ruta del comando a tu variable `PATH` o perfil de shell (`~/.bashrc`, `$PROFILE`).

### 4. Iniciar el Sistema

Ejecuta el comando global CLI para compilar y levantar los contenedores:

```bash
faztnotes start
```

Accede a la interfaz web en **`http://localhost:3780`**.

---

## Comandos CLI

La CLI de `faztnotes` simplifica la gestión de contenedores en Linux, macOS y Windows:

| Comando | Descripción |
| :--- | :--- |
| `faztnotes start` | Compila imágenes (si es necesario), inicia contenedores en segundo plano y verifica la salud del backend |
| `faztnotes stop` | Detiene y remueve los contenedores de forma limpia conservando el volumen persistente de datos |
| `faztnotes logs` | Acopla y transmite los logs combinados de los contenedores en tiempo real (`Ctrl+C` para salir) |
| `faztnotes install` | Configura el perfil de shell o la variable `PATH` del sistema para ejecutar la CLI globalmente |

---

## Características Principales

### 1. Gestión de Documentación Técnica
- **Estructura en Árbol de Carpetas:** Crea carpetas técnicas (`/backend`, `/arquitectura`, `/devops`) mediante el botón `+ CARPETA`.
- **Drag & Drop:** Arrastra notas entre carpetas de forma fluida sin recargar la página.
- **Filtros Dinámicos:** Búsqueda textual por carpeta o por etiquetas técnicas (`#etiqueta`).
- **Estado de Indexación Vectorial:** Indicadores visuales `[VECT]` que confirman la presencia de la nota en la memoria vectorial.

### 2. Editor Markdown Estilo IDE
- **3 Modos de Edición:** `Edición`, `Dividido` (vista lado a lado) y `Vista previa`.
- **Numeración de Líneas Sincronizada:** Seguimiento de líneas entre los paneles de edición y vista previa.
- **Resaltado de Sintaxis:** Bloques de código con estilo, encabezados en esmeralda (`#`, `##`), código en línea ámbar, citas y enlaces.

### 3. Consola Ejecutiva IA Nexo
- **Transmisión en Tiempo Real:** Generación continua de respuesta token por token mediante Server-Sent Events (SSE).
- **Respuestas Fundamentadas:** Respuestas strictly basadas en tus notas con citas obligatorias en línea (`[Fuente: Título (ID)]`).
- **Panel de Contexto Recuperado:** Inspecciona los fragmentos de notas extraídos junto con sus puntuaciones de similitud coseno.
- **Monitoreo de Latencia:** Muestra el tiempo total de respuesta de la consulta en milisegundos.
- **Control de Top-K:** Ajusta dinámicamente la cantidad de fragmentos contextuales inyectados en la generación.

---

## Referencia de la API

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/health` | Chequeo de estado del sistema (PostgreSQL, conectividad del motor IA, total de notas) |
| `GET` | `/api/notes` | Listado de notas con filtros opcionales de `search`, `tag` y `folder` |
| `POST` | `/api/notes` | Creación de nota con indexación inmediata en `pgvector` |
| `PUT` | `/api/notes/{id}` | Actualización de contenido de nota y regeneración de vector |
| `DELETE` | `/api/notes/{id}` | Eliminación transaccional del contenido de la nota y su vector |
| `GET` | `/api/notes/folders` | Obtiene la lista de carpetas activas |
| `GET` | `/api/notes/tags` | Obtiene la lista de etiquetas registradas en las notas |
| `GET` | `/api/nexo/stream` | Transmisión en tiempo real de respuestas RAG vía SSE |
| `POST` | `/api/nexo/query` | Endpoint sincrónico para consultas RAG |

---

## Estructura del Proyecto

```
fazt-notes/
├── .env.example          # Plantilla de variables de entorno
├── docker-compose.yml    # Orquestación multicontenedor (db, backend, frontend)
├── faztnotes             # Script ejecutable CLI para Linux / macOS / Git Bash
├── faztnotes.ps1         # Script ejecutable CLI para Windows PowerShell
├── faztnotes.cmd         # Lanzador ejecutable para Windows CMD
├── logo.png              # Logotipo oficial del sistema
├── backend/              # Servicio FastAPI con pgvector y pipeline RAG
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
└── frontend/             # SPA React + TypeScript servida por Nginx
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
