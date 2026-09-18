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

**NexoNotes** es un sistema autónomo y privado de gestión de documentación técnica con un motor **RAG (Retrieval-Augmented Generation)** integrado y contenerizado mediante Docker, creado por el equipo de **Nexus Studio**.

Diseñado específicamente para desarrolladores, ingenieros de software, administradores de sistemas y líderes técnicos, NexoNotes destaca por ser una herramienta **ultrarrápida, minimalista y de alta eficiencia**, dotada de una cuidada **estética de TERMINAL, CLI o IDE**. Su interfaz optimizada de alta densidad informativa garantiza una experiencia técnica fluida y sin distracciones, basada en texto plano enriquecido en Markdown y eliminando cualquier sobrecarga visual o elementos gráficos innecesarios. Te permite centralizar, organizar y consultar tu base de conocimiento técnica de forma instantánea, privada y sin delegar datos ni vectores a servicios en la nube de terceros.

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
- **Backend API:** FastAPI (Python 3.11), SQLAlchemy 2.0, Microsoft MarkItDown y transmisiones en tiempo real mediante Server-Sent Events (SSE). Indexación vectorial inmediata en cada creación o edición.
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

### 1. Gestión de Documentación Técnica (Estética de Terminal / IDE)
- **Explorador Jerárquico Estilo IDE:** Árbol de archivos real sin carpetas artificiales; las notas de la raíz se muestran directamente en la raíz y cada carpeta despliega sus elementos correspondientes.
- **Drag & Drop a la Raíz:** Arrastra notas y carpetas dentro del árbol para moverlas. Soltarlas en cualquier espacio del explorador resaltado en verde esmeralda las mueve directamente a la raíz (`/`).
- **Búsqueda Global Autónoma:** Busca simultáneamente por título, contenido y etiquetas. Al escribir una consulta, el sistema inspecciona y abre automáticamente todas las carpetas que contengan coincidencias y oculta las que no coincidan.
- **Filtro de Múltiples Etiquetas:** Selecciona varias etiquetas simultáneamente (`#etiqueta`) con actualización reactiva en tiempo real y opción de restablecimiento con `TODAS`.
- **Menú Contextual de Tres Puntos (`...`):** Cada nota y carpeta cuenta con un menú con opciones rápidas de apertura, copia, exportación y eliminación.
- **Vectorización Transparente:** La indexación en pgvector ocurre de fondo. Si ocurre un fallo (límites de API o cuota de Gemini), se despliega un mensaje explícito en rojo brillante informando el motivo exacto.

### 2. Visualización y Edición Markdown
- **Modo Lectura a Pantalla Completa:** Al hacer clic en una nota, se abre directamente en modo de lectura completo Markdown ocupando todo el panel central.
- **Editor Interactivo:** Botón `[EDITAR]` con selector de modos (`Edición`, `Dividido`, `Vista previa`) y campos de título, carpeta y etiquetas.
- **Renderizado Técnico:** Bloques de código con resaltado, tablas, listas y renderizado de fórmulas matemáticas LaTeX.

### 3. Importación Inteligente con Microsoft MarkItDown
- **Soporte de Formatos:** Importa archivos individuales Markdown (`.md`, `.txt`), Word (`.docx`), PDF (`.pdf`) o paquetes comprimidos (`.zip`) manteniendo la jerarquía de directorios.
- **Motor de Conversión (Microsoft MarkItDown):** Integra la biblioteca oficial **[Microsoft MarkItDown](https://github.com/microsoft/markitdown)** para convertir documentos PDF y Word en sintaxis Markdown de forma transparente.
- **Filtrado Preventivo de ZIP:** Al subir un archivo ZIP, el sistema analiza su contenido. Si contiene elementos no soportados (como imágenes o presentaciones PowerPoint), los descarta de forma segura y despliega un aviso detallado.

> [!WARNING]
> **Nota sobre la Conversión de Documentos (Microsoft MarkItDown):**
> La conversión de archivos Word (`.docx`) y PDF (`.pdf`) a Markdown se realiza de forma automatizada mediante la herramienta **Microsoft MarkItDown**. Debido a la naturaleza estrucural compleja de ciertos formatos binarios, la conversión automatizada puede presentar imperfecciones o ligeras fallas de formato en tablas avanzadas, imágenes incrustadas o dislocaciones tipográficas. Si detectas alguna inexactitud en el documento convertido, puedes corregirla fácilmente usando el editor Markdown integrado.

### 4. Exportación y Respaldo
- **Descarga de Notas Individuales (.md):** Botón de exportación directa o menú contextual para obtener el archivo Markdown nativo.
- **Empaquetado de Carpetas y Workspace (ZIP):** Exporta cualquier carpeta completa o el espacio de trabajo entero comprimido en formato `.zip` preservando la jerarquía relativa de subcarpetas.

### 5. Consola Ejecutiva IA Nexo (Motor RAG)
- **Transmisión SSE en Tiempo Real:** Respuestas generadas token por token sin esperas.
- **Banner ASCII Interactivo:** Interfaz de consola con animación glífica y estética cyberpunk/terminal.
- **Respuestas Cimentadas:** Respuestas estrictamente fundamentadas en la base de notas con citas obligatorias (`[Fuente: Título (ID)]`).
- **Ajuste de Parámetro "Notas de Contexto":** Controla el límite de fragmentos más relevantes recuperados por `pgvector` con un ícono de ayuda (`?`) y tooltip interactivo que explica su funcionamiento.
- **Temperatura Calibrada (0.3):** Ajustada para ofrecer un equilibrio óptimo entre creatividad explicativa y rigor documental.
- **Atribución Institucional:** Nexo reconoce su propósito y acredita su desarrollo al equipo de **Nexus Studio**.

### 6. Barra de Estado Permanente y Atajos de Teclado
- **Barra de Estado del Sistema (`[SYSTEM]`):** Fija en la interfaz. Muestra en tiempo real eventos con código de color:
  - **Carga:** Gris con pulso (`[SYSTEM: CARGANDO]`).
  - **Éxito:** Verde esmeralda (`[SYSTEM: OK]`).
  - **Error:** Rojo (`[SYSTEM: FALLO]`).
  - Al transcurrir 5 segundos de inactividad, el mensaje se limpia ejecutando una animación de borrado con efecto glífico/matrix.
- **Atajos de Teclado:**
  - `[F1]`: Cambiar a panel de Notas
  - `[F2]`: Cambiar a Consola Nexo
  - `[ALT+N]`: Crear nueva nota
  - `[ALT+F]`: Crear nueva carpeta
  - `[ALT+R]`: Renombrar nota o carpeta seleccionada
  - `[SUPR] / [DELETE]`: Eliminar nota o carpeta seleccionada
  - `[CTRL+C] / [CTRL+V]`: Copiar y pegar notas o carpetas
- **Acceso al Código Fuente:** Botón en el pie de página con el ícono oficial de GitHub y enlace directo al repositorio.

---

## Manual de Usuario / Guía Práctica

### 1. Navegación y Gestión de Archivos
- **Creación:** Utiliza los botones `+ NOTA` y `+ CARPETA` en el explorador.
- **Búsqueda:** Escribe cualquier término en el buscador. Las carpetas coincidentes se abrirán automáticamente.
- **Arrastre a la Raíz:** Arrastra cualquier archivo o carpeta hasta soltarlo en el espacio del explorador marcado en verde para moverlo a la raíz.
- **Portapapeles:** Selecciona una nota o carpeta, presiona `Ctrl+C` para copiarla y `Ctrl+V` para pegarla en otra carpeta o en la raíz.

### 2. Importación y Conversión
- Haz clic en el botón de importación en la barra superior o dentro de cualquier carpeta.
- Selecciona tu archivo `.md`, `.docx`, `.pdf` o `.zip`.
- Si importas un PDF o Word, **Microsoft MarkItDown** lo convertirá automáticamente a Markdown. Revisa la nota resultante si deseas hacer ajustes manuales de formato.

### 3. Asistente Nexo
- Accede a la pestaña `[2] CONSOLA NEXO`.
- Escribe tu consulta técnica. Nexo buscará en tus notas y te ofrecerá una respuesta fundamentada con citas.
- Ajusta el selector **`NOTAS CONTEXTO`** para variar el número de fragmentos consultados.

---

## Referencia de la API

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/health` | Estado del sistema (PostgreSQL, motor IA Gemini y total de notas) |
| `GET` | `/api/notes` | Listado de notas con filtros de `search`, `tag` y `folder` |
| `POST` | `/api/notes` | Creación de nota con indexación inmediata en `pgvector` |
| `POST` | `/api/notes/import` | Importa y convierte archivos `.md`, Word, PDF y ZIP a Markdown mediante MarkItDown |
| `GET` | `/api/notes/{id}/export` | Descarga la nota en formato Markdown (`.md`) |
| `GET` | `/api/notes/export/folder` | Exporta carpetas o el workspace completo en `.zip` |
| `PUT` | `/api/notes/{id}` | Actualización de contenido de nota y regeneración de vector |
| `DELETE` | `/api/notes/{id}` | Eliminación de nota e índice vectorial |
| `DELETE` | `/api/notes/folder` | Elimina una carpeta completa con sus notas y subcarpetas |
| `GET` | `/api/notes/folders` | Lista de carpetas activas |
| `GET` | `/api/notes/tags` | Lista de etiquetas registradas |
| `GET` | `/api/nexo/stream` | Transmisión en tiempo real de respuestas RAG vía SSE |
| `POST` | `/api/nexo/query` | Endpoint sincrónico para consultas RAG |

---

## Estructura del Proyecto

```
NexoNotes/
├── LICENSE.md            # Licencia de Código Abierto No Comercial
├── .env.example          # Plantilla de variables de entorno
├── docker-compose.yml    # Orquestación multicontenedor (db, backend, frontend)
├── nexonotes             # Script ejecutable CLI para Linux / macOS / Git Bash
├── nexonotes.ps1         # Script ejecutable CLI para Windows PowerShell
├── nexonotes.cmd         # Lanzador ejecutable para Windows CMD
├── logo-animated.gif     # Logotipo animado oficial
├── logo.png              # Logotipo oficial del sistema
├── README.md             # Documentación principal en Español
├── README_en.md          # Documentación en Inglés
├── backend/              # Servicio FastAPI con pgvector, MarkItDown y pipeline RAG
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

## Licencia

Este proyecto es software libre y de código abierto bajo los términos de la licencia **[PolyForm Noncommercial License 1.0.0](LICENSE.md)**.

- **Uso Permitido:** Eres libre de descargar, compilar, estudiar, modificar, adaptar y distribuir este proyecto para fines personales, educativos, de investigación o de gestión interna.
- **Restricción Comercial:** Queda estrictamente prohibido vender, sublicenciar, revender o comercializar este software o sus derivados como un producto o servicio de venta cerrado con fines de lucro comercial directo.

Para consultas sobre licenciamiento o adaptaciones a medida, comunícate con el equipo de **Nexus Studio**.

---

## Apoyo al Proyecto

Si **NexoNotes** te resulta de utilidad para estructurar tu conocimiento técnico y acelerar tus flujos de trabajo mediante RAG local y privado, considera apoyar el desarrollo continuo y el lanzamiento de futuras herramientas de código abierto.

<div align="center">

<a href="https://www.buymeacoffee.com/carlosNahuelSanchez" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="48" />
</a>

<script type="text/javascript" src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js" data-name="bmc-button" data-slug="carlosNahuelSanchez" data-color="#000000" data-emoji="" data-font="Poppins" data-text="Buy me a coffee" data-outline-color="#ffffff" data-font-color="#ffffff" data-coffee-color="#FFDD00"></script>

</div>

---

<div align="center">

Hecho por el equipo de **Nexus Studio**

</div>

