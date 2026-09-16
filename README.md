# FAZTNOTES // RAG PRIVADO DE GESTION DOCUMENTAL

Sistema autonomo y privado de gestion de notas tecnicas con motor RAG (Retrieval-Augmented Generation) contenerizado en Docker. Cuenta con una interfaz tecnica con estetica de consola/terminal, organizacion mediante directorios y arrastre (Drag & Drop), editor Markdown con caracteristicas de IDE y un asistente ejecutivo integrado (**Nexo**) que transmite respuestas en tiempo real fundamentadas exclusivamente en el contenido de tus notas.

---

## Que es y Para Que Sirve

**FaztNotes** esta disenado para ingenieros de software, desarrolladores y administradores de sistemas que requieren centralizar y consultar su base de conocimiento tecnica sin delegar la persistencia de datos a plataformas de terceros.

### Casos de Uso Principales
1. **Base de Conocimiento Tecnica Privada:** Almacenamiento local y seguro de guias, configuraciones de infraestructura, comandos y arquitectura de proyectos en formato Markdown.
2. **Motor RAG Local (Retrieval-Augmented Generation):** Cada nota creada o editada se vectoriza de forma automatica e inmediata en PostgreSQL con la extension `pgvector`.
3. **Asistente Ejecutivo Nexo:** Consulta interactiva en lenguaje natural con streaming continuo. Nexo solo responde con informacion extraida de tus notas, citando la fuente documental exacta `[Fuente: Titulo (ID)]` y rechazando responder si el contexto no cubre la pregunta.
4. **Organizacion Intuitiva tipo Consola:** Agrupacion por carpetas mediante arrastrar y soltar (Drag and Drop), busqueda textual instantanea y filtrado por etiquetas tecnicas.

---

## Arquitectura del Sistema

```
[ Navegador Web ]
       │
       ▼ (Puerto 3780)
[ Frontend: React 18 + Nginx ]
       │
       ▼ (Reverse Proxy interno /api/)
[ Backend: FastAPI (Python 3.11) ] ───► [ Motor IA: Gemini API ]
       │                                (text-embedding / gemini-3.5-flash-lite)
       ▼
[ Base de Datos: PostgreSQL 16 + pgvector ]
  ├── notes (id, title, content, tags, folder, created_at, updated_at)
  └── embedding (Vector 768d con indice HNSW cosine)
```

- **Base de Datos y Persistencia Vectorial:** PostgreSQL 16 con extension `pgvector` activada. Soporta vectores de 768 dimensiones e indice HNSW para busquedas semanticas de alta velocidad.
- **Backend API:** FastAPI (Python 3.11), SQLAlchemy 2.0 y streaming Server-Sent Events (SSE). Vectorizacion transaccional inmediata en cada mutacion.
- **Frontend SPA:** React 18, TypeScript, Tailwind CSS con estetica de consola monocromatica y alta densidad de informacion, servido por Nginx con proxy inverso integrado.
- **Orquestacion:** Docker Compose multi-contenedor.

---

## Puertos del Sistema

Para evitar colisiones con entornos de desarrollo locales habituales, el sistema opera en los siguientes puertos:

| Servicio | URL / Puerto | Descripcion |
| :--- | :--- | :--- |
| **Frontend UI** | `http://localhost:3780` | Panel de gestion de notas y consola Nexo |
| **Backend API** | `http://localhost:8780` | Endpoints REST y streaming SSE |
| **Documentacion API** | `http://localhost:8780/docs` | Interfaz interactiva Swagger / OpenAPI |
| **PostgreSQL** | `localhost:5432` | Base de datos relacional y extension `pgvector` |

---

## Requisitos Previos

- Docker Engine 24+ y Docker Compose v2+.
- Clave de API de Google Gemini (`GEMINI_API_KEY`).

---

## Instalacion y Puesta en Marcha

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/fazt-notes.git
cd fazt-notes
```

### 2. Configurar Variables de Entorno
Copia el archivo de configuracion base:
```bash
cp .env.example .env
```
*(En Windows PowerShell: `Copy-Item .env.example .env`)*

Edita el archivo `.env` e ingresa tu clave de Gemini:
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

### 3. Registrar el Comando Global CLI (Un solo paso)
Para ejecutar `faztnotes` desde cualquier terminal sin tener que estar dentro del directorio del proyecto:

- **En Windows PowerShell:**
  ```powershell
  .\faztnotes.ps1 install
  ```
- **En Linux, macOS o Git Bash:**
  ```bash
  ./faztnotes install
  ```

Este paso detecta tu entorno y configura de forma automatica el comando en tu `$PROFILE`, `PATH` de usuario o `~/.bashrc`.

---

## Comandos de Operacion (CLI)

Una vez ejecutado el instalador, puedes operar el sistema desde cualquier directorio con los siguientes comandos:

### Iniciar el Sistema
Compila las imagenes si es necesario, levanta los contenedores en segundo plano y comprueba la salud de los servicios:
```bash
faztnotes start
```

### Ver Logs en Tiempo Real
Acopla la salida combinada de logs de la base de datos, backend y frontend:
```bash
faztnotes logs
```

### Detener el Sistema
Detiene y remueve los contenedores de forma limpia conservando el volumen de datos persistente:
```bash
faztnotes stop
```

---

## Caracteristicas de la Interfaz

### 1. Panel de Gestion de Notas
- **Arbol de Directorios (FolderTree):** Crea carpetas tecnicas (`/backend`, `/arquitectura`, `/devops`) con el boton `+ CARPETA`.
- **Drag & Drop:** Arrastra cualquier nota desde el listado y sueltala sobre una carpeta para moverla de ubicacion de forma inmediata sin recargar la aplicacion.
- **Filtros Dinamicos:** Filtrado cruzado por carpeta, por etiquetas tecnicas (`#etiqueta`) y por coincidencia textual en titulo o contenido.
- **Insignia de Vectorizacion:** Cada nota muestra el estado `[VECT]` al ser indexada en la base vectorial.

### 2. Editor de Contenido tipo IDE
- Selector de modo: `EDICION`, `DIVIDIDO` (split view) y `VISTA PREVIA`.
- Columna izquierda con numeracion de lineas sincronizada.
- Resaltado de sintaxis en tiempo real:
  - Encabezados (`#`, `##`, `###`) en verde esmeralda.
  - Bloques de codigo y comandos en linea (`` `codigo` ``) en ambar con marco oscuro.
  - Listas (`-`, `*`, `1.`), citas (`>`) y enlaces tecnicos resaltados.

### 3. Consola Ejecutiva Nexo
- **Streaming en Vivo (SSE):** Generacion de respuesta token por token en tiempo real.
- **Estricta Fundamentacion Documental:** Cita obligatoria de la fuente de cada afirmacion con sintaxis `[Fuente: Titulo (ID)]`.
- **Panel de Fuentes Consultadas:** Visualizacion de cada fragmento relevante recuperado, su extracto y su porcentaje de coincidencia semantica.
- **Medicion de Latencia:** Cronometraje tecnico de tiempo de respuesta expresado en milisegundos (`[LATENCIA TOTAL: 312 ms]`).
- **Control de Top-K:** Ajuste en caliente de la cantidad de fragmentos contextuales inyectados en la consulta.

---

## Referencia de Endpoints Principales (API REST)

| Metodo | Ruta | Descripcion |
| :--- | :--- | :--- |
| `GET` | `/health` | Chequeo de estado de PostgreSQL, conexion con motor IA y total de notas |
| `GET` | `/api/notes` | Listado ordenado de notas (soporta `search`, `tag`, `folder`) |
| `POST` | `/api/notes` | Creacion de nota con vectorizacion inmediata en `pgvector` |
| `PUT` | `/api/notes/{id}` | Modificacion de contenido/metadatos y regeneracion de vector |
| `DELETE`| `/api/notes/{id}` | Eliminacion transaccional relacional y vectorial |
| `GET` | `/api/notes/folders` | Listado de carpetas tecnicas activas |
| `GET` | `/api/notes/tags` | Listado de etiquetas distintas registradas |
| `GET` | `/api/nexo/stream` | Endpoint de consulta RAG con transmision en tiempo real (SSE) |
| `POST`| `/api/nexo/query` | Endpoint sincrono de consulta RAG |

---

## Estructura de Directorios

```
fazt-notes/
├── .env.example          # Plantilla de variables de entorno
├── docker-compose.yml    # Orquestacion de contenedores (db, backend, frontend)
├── faztnotes             # Script ejecutable CLI para Linux / macOS / Git Bash
├── faztnotes.ps1         # Script ejecutable CLI para Windows PowerShell
├── faztnotes.cmd         # Lanzador directo para Windows CMD
├── logo.png              # Logotipo oficial del sistema
├── backend/              # Servicio API FastAPI con pgvector y motor RAG
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
└── frontend/             # Interfaz de usuario React + TypeScript + Nginx
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── App.tsx
        ├── api.ts
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

---

## Licencia
Distribuido bajo estandares de software libre y codigo abierto para uso privado y educativo.
