<!-- prettier-ignore -->
<div align="center">

<img src="./logo-animated.gif" alt="Logo de NexoNotes" height="100" />

# NexoNotes

*Sistema Autónomo y Privado de Gestión de Documentos Técnicos y Motor RAG*

[![English Documentation](https://img.shields.io/badge/Language-English-blue.svg)](README_en.md)
[![License: PolyForm Noncommercial](https://img.shields.io/badge/Licencia-Software_Libre_No_Comercial-green.svg)](LICENSE.md)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-24%2B-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E7CC3?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

[Descripción General](#descripción-general) • [Arquitectura](#arquitectura-del-sistema) • [Puertos del Sistema](#puertos-del-sistema) • [Requisitos Previos](#requisitos-previos) • [Inicio Rápido](#inicio-rápido) • [Comandos CLI](#comandos-cli) • [Características](#características-principales) • [Manual de Usuario](#manual-de-usuario--guía-práctica) • [Referencia API](#referencia-de-la-api) • [Licencia](#licencia)

</div>

---

> [!NOTE]
> **Documentación en Inglés:** Puedes consultar la versión en inglés de esta documentación en la raíz del proyecto: [README_en.md](README_en.md).

---

## Descripción General

**NexoNotes** es un sistema autónomo y privado de gestión de documentación técnica con un motor **RAG (Retrieval-Augmented Generation)** integrado y contenerizado mediante Docker.

Diseñado específicamente para desarrolladores, ingenieros de software, administradores de sistemas y líderes técnicos, NexoNotes destaca por ser una herramienta **ultrarrápida, minimalista y de alta eficiencia**, dotada de una cuidada **estética técnica de TERMINAL, CLI o IDE**. Su interfaz optimizada de alta densidad informativa garantiza una experiencia técnica fluida y sin distracciones, basada en texto plano enriquecido en Markdown y eliminando cualquier sobrecarga visual innecesaria. Te permite centralizar, organizar y consultar tu base de conocimiento técnica de forma instantánea, privada y sin delegar datos ni vectores a servicios en la nube de terceros.

> [!IMPORTANT]
> Todas las notas se almacenan localmente en PostgreSQL y se vectorizan de forma automática en embeddings de 768 dimensiones utilizando `pgvector`. Tus datos permanecen 100% bajo tu control y las consultas a Nexo se responden de forma estricta y fundamentada utilizando únicamente la información recuperada de tus notas.

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

Para evitar colisiones con entornos de desarrollo locales, NexoNotes opera en los siguientes puertos predeterminados:

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
git clone https://github.com/carlosNahuelSanchez/NexoNotes.git
cd NexoNotes
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
POSTGRES_DB=nexonotes_db
POSTGRES_USER=nexonotes_admin
POSTGRES_PASSWORD=nexonotes_secure_pass
POSTGRES_PORT=5432
BACKEND_PORT=8780
FRONTEND_PORT=3780
LLM_MODEL=gemini-3.5-flash-lite
```

### 3. Registrar el Comando Global CLI

Registra el comando `nexonotes` de forma global para ejecutarlo desde cualquier terminal:

- **Linux / macOS / Git Bash:**
  ```bash
  ./nexonotes install
  ```

- **Windows PowerShell:**
  ```powershell
  .\nexonotes.ps1 install
  ```

> [!IMPORTANT]
> El script de instalación detecta automáticamente tu entorno y agrega la ruta del comando a tu variable `PATH` o perfil de shell (`~/.bashrc`, `$PROFILE`).

### 4. Iniciar el Sistema

Ejecuta el comando global CLI para compilar y levantar los contenedores:

```bash
nexonotes start
```

Accede a la interfaz web en **`http://localhost:3780`**.

---

## Comandos CLI

La CLI de `nexonotes` simplifica la gestión de contenedores en Linux, macOS y Windows:

| Comando | Descripción |
| :--- | :--- |
| `nexonotes start` | Compila imágenes (si es necesario), inicia contenedores en segundo plano y verifica la salud del backend |
| `nexonotes stop` | Detiene y remueve los contenedores de forma limpia conservando el volumen persistente de datos |
| `nexonotes logs` | Acopla y transmite los logs combinados de los contenedores en tiempo real (`Ctrl+C` para salir) |
| `nexonotes install` | Configura el perfil de shell o la variable `PATH` del sistema para ejecutar la CLI globalmente |

---

## Características Principales

### 1. Gestión de Documentación Técnica
- **Explorador Jerárquico Estilo IDE:** Árbol de archivos real sin carpetas artificiales; las notas de la raíz se muestran directamente en la raíz y cada carpeta despliega solo sus elementos inmediatos.
- **Drag & Drop Fluido:** Arrastra notas y carpetas para reestructurar la jerarquía al instante.
- **Filtros Dinámicos:** Búsqueda textual en tiempo real por título y filtrado por etiquetas técnicas (`#etiqueta`).
- **Vectorización Transparente con Diagnóstico:** La indexación en pgvector ocurre de fondo. Si ocurre algún error (límite de tokens, cuota o fallo de API de Gemini), el sistema despliega un banner de error explícito en color rojo con el motivo exacto del fallo.

### 2. Visualización y Edición Markdown
- **Modo de Lectura Completo:** Al seleccionar una nota, se despliega enteramente en Markdown a pantalla completa en el panel principal para una experiencia libre de distracciones.
- **Editor Interactivo:** Botón `[EDITAR]` que abre el panel de edición con modos `Edición`, `Dividido` y `Vista previa`.
- **Cierre y Renderizado Automático:** Al pulsar `[GUARDAR NOTA]`, el editor se cierra automáticamente y regresa al modo de lectura completo con los cambios aplicados.
- **Resaltado de Sintaxis:** Bloques de código con estilo, encabezados estilizados, citas y tablas.

### 3. Importación Inteligente y Verificación de Documentos (Microsoft MarkItDown)
- **Soporte Markdown Nativo y ZIP:** Importa archivos individuales (`.md`, `.markdown`, `.txt`) o paquetes completos comprimidos en `.zip` manteniendo la estructura de directorios.
- **Conversión de Word y PDF con Microsoft MarkItDown:** Integra la potente biblioteca **[Microsoft MarkItDown](https://github.com/microsoft/markitdown)** para convertir de forma transparente documentos Word (`.docx`) y archivos PDF (`.pdf`) en sintaxis Markdown limpia y estructurada.
- **Filtrado y Verificación Preventiva:** Al importar un archivo ZIP, el sistema valida que cada elemento corresponda a un formato legible por el sistema. Si se detectan archivos no permitidos (como imágenes `.png`/`.jpg` o presentaciones PowerPoint `.pptx`), se descartan de forma segura y se despliega un aviso detallado informando al usuario cuáles archivos fueron omitidos.
- **Indexación Vectorial Inmediata:** Los documentos importados se procesan y vectorizan automáticamente en PostgreSQL (`pgvector`), quedando disponibles al instante para el Asistente Nexo.
- **Atajos Directos por Carpeta:** Botón `[IMPORTAR]` en la barra superior y atajo rápido `+IMP` en cada carpeta para importar archivos directamente en cualquier nivel de la jerarquía.

### 4. Exportación Integral de Notas y Carpetas
- **Descarga de Notas Individuales (.md):** Botón `[EXPORTAR MD]` en el encabezado de lectura y atajo `EXP` en el explorador para descargar cualquier nota como archivo Markdown nativo.
- **Empaquetado de Carpetas en ZIP:** Exporta cualquier carpeta completa con todas sus subcarpetas y notas convertidas en archivos `.md` preservando la jerarquía relativa mediante el botón `EXP` en el explorador.
- **Respaldo Completo del Workspace:** Botón `ZIP` en la barra superior para descargar un archivo comprimido que contiene todas las notas y carpetas del sistema.

### 5. Consola Ejecutiva IA Nexo
- **Transmisión en Tiempo Real:** Generación continua de respuesta token por token mediante Server-Sent Events (SSE).
- **Banner Animado en ASCII:** Interfaz de bienvenida con animación ASCII interactiva y estética de terminal de alta tecnología.
- **Respuestas Fundamentadas:** Respuestas estrictamente basadas en tus notas con citas obligatorias en línea (`[Fuente: Título (ID)]`).
- **Panel de Contexto Recuperado:** Inspecciona los fragmentos de notas extraídos junto con sus puntuaciones de similitud coseno.
- **Monitoreo de Latencia:** Muestra el tiempo total de respuesta de la consulta en milisegundos.
- **Control de Top-K:** Ajusta dinámicamente la cantidad de fragmentos contextuales inyectados en la generación.

---

## Manual de Usuario / Guía Práctica

### 1. Explorador de Archivos y Carpetas (Estilo IDE)
- **Estructura Real sin Carpetas Ficticias:** Las notas creadas en la raíz aparecen directamente en el explorador (como archivos `.md` en un IDE).
- **Navegación Jerárquica:** Al desplegar una carpeta, solo verás sus subcarpetas y archivos directos, manteniendo una visualización limpia y ordenada.
- **Creación Rápida:** Utiliza `+ NOTA` o `+ CARPETA` en la barra superior del explorador, o los botones directos `+NOTA` y `+SUB` en el encabezado de cualquier carpeta para crear contenido directamente dentro de ella.
- **Organización por Drag & Drop:** Puedes arrastrar notas o carpetas enteras para moverlas a otra carpeta o soltarlas en `[MOVER A RAÍZ /]` en la base del árbol.

### 2. Visualización y Edición en Markdown
- **Lectura a Pantalla Completa:** Al seleccionar cualquier nota del explorador, se abre inmediatamente en **modo de lectura completo en Markdown**, ocupando todo el espacio de trabajo para una lectura técnica cómoda.
- **Botón `[EDITAR]`:** Abre el editor interactivo con selector de modos (`Edición`, `Dividido`, `Vista previa`) y campos de título, carpeta y etiquetas.
- **Botón `[GUARDAR NOTA]`:** Guarda los cambios en la base de datos, actualiza los índices y regresa automáticamente al modo de lectura completo.
- **Alertas de Fallo en Rojo:** Si la vectorización falla por tokens o problemas en Gemini, un mensaje en **rojo brillante** te informará con precisión el motivo del error.

### 3. Importación de Archivos (Markdown, Word, PDF y ZIP)
- **Desde la barra del explorador:** Pulsa el botón `[IMPORTAR]` para cargar cualquier archivo o archivo ZIP local en la raíz.
- **En carpetas específicas:** Haz clic en el botón rápido `+IMP` en el encabezado de cualquier carpeta para importar y convertir un documento directamente dentro de esa ubicación.
- **Formatos admitidos:**
  - Archivos Markdown y texto plano (`.md`, `.markdown`, `.txt`).
  - Documentos de Microsoft Word (`.docx`).
  - Documentos PDF (`.pdf`).
  - Archivos comprimidos (`.zip`).
- **Conversión y Verificación:** Las notas y documentos válidos se convierten a Markdown con **Microsoft MarkItDown**. Si un paquete ZIP contiene archivos incompatibles (imágenes, ejecutables, PPTX), estos son descartados y el sistema reporta la advertencia explícita en pantalla.

### 4. Exportación de Archivos y Carpetas (Descarga .md y .zip)
- **Exportar Nota:** En el panel de lectura pulsa el botón `[EXPORTAR MD]` o en el explorador presiona `EXP` en la fila de la nota para descargar el archivo `.md`.
- **Exportar Carpeta:** Haz clic en `EXP` en el encabezado de cualquier carpeta para descargar un archivo ZIP con todas las subcarpetas y notas pertenecientes a ella.
- **Exportar Todo:** Haz clic en el botón `ZIP` en la barra superior del explorador para descargar un archivo comprimido de todo tu espacio de trabajo.

### 5. Uso del Asistente Nexo (Consola RAG)
- Cambia a la pestaña **`[2] CONSOLA NEXO`** en la barra superior.
- Observa la animación de bienvenida en arte ASCII interactivo.
- Escribe cualquier pregunta técnica en lenguaje natural sobre los temas documentados en tus notas.
- Nexo responde en tiempo real con transmisión continua, fundamentando cada párrafo con citas explícitas `[Fuente: Título (ID)]`.

---

## Referencia de la API

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/health` | Chequeo de estado del sistema (PostgreSQL, conectividad del motor IA, total de notas) |
| `GET` | `/api/notes` | Listado de notas con filtros opcionales de `search`, `tag` y `folder` |
| `POST` | `/api/notes` | Creación de nota con indexación inmediata en `pgvector` |
| `POST` | `/api/notes/import` | Importa y convierte archivos `.md`, Word (`.docx`), PDF y ZIP a Markdown con validación de formatos |
| `GET` | `/api/notes/{id}/export` | Descarga la nota en formato Markdown (`.md`) |
| `GET` | `/api/notes/export/folder` | Exporta carpetas o el workspace completo como archivo comprimido (`.zip`) |
| `PUT` | `/api/notes/{id}` | Actualización de contenido de nota y regeneración de vector |
| `DELETE` | `/api/notes/{id}` | Eliminación transaccional del contenido de la nota y su vector |
| `GET` | `/api/notes/folders` | Obtiene la lista de carpetas activas |
| `GET` | `/api/notes/tags` | Obtiene la lista de etiquetas registradas en las notas |
| `GET` | `/api/nexo/stream` | Transmisión en tiempo real de respuestas RAG vía SSE |
| `POST` | `/api/nexo/query` | Endpoint sincrónico para consultas RAG |

---

## Estructura del Proyecto

```
NexoNotes/
├── LICENSE.md            # Licencia de Software Libre No Comercial
├── .env.example          # Plantilla de variables de entorno
├── docker-compose.yml    # Orquestación multicontenedor (db, backend, frontend)
├── nexonotes             # Script ejecutable CLI para Linux / macOS / Git Bash
├── nexonotes.ps1         # Script ejecutable CLI para Windows PowerShell
├── nexonotes.cmd         # Lanzador ejecutable para Windows CMD
├── logo-animated.gif     # Logotipo animado oficial
├── logo.png              # Logotipo oficial del sistema
├── README.md             # Documentación principal en Español
├── README_en.md          # Documentación en Inglés
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

## Licencia

Este proyecto es software libre y de código abierto bajo los términos de la licencia **[PolyForm Noncommercial License 1.0.0](LICENSE.md)**.

- **Uso Permitido:** Eres libre de descargar, compilar, estudiar, modificar, adaptar y distribuir este proyecto para fines personales, educativos, de investigación o de gestión interna.
- **Restricción Comercial:** Queda estrictamente prohibido vender, sublicenciar, revender o comercializar este software o sus derivados como un producto o servicio de venta cerrado con fines de lucro comercial directo.

Para consultas de licenciamiento empresarial o comercial, comunícate con el equipo de **Nexus Studio**.

---

<div align="center">

Hecho por el equipo de **Nexus Studio**

</div>
