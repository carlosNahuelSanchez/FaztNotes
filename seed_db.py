import json
import urllib.request
import time

NOTES = [
    {
        "title": "Bienvenido a NexoNotes",
        "folder": None,
        "tags": ["bienvenida", "nexonotes", "guia"],
        "content": """# ¡Bienvenido a NexoNotes! 🚀

**NexoNotes** es tu espacio personal inteligente para la gestión de notas técnicas, documentación de arquitectura y fragmentos de código, impulsado por **IA Contextual (RAG)** y **Búsqueda Vectorial**.

---

## 🔥 Caracteristicas Destacadas

1. **Búsqueda Semántica Vectorial**: Encuentra notas por su significado conceptual, no solo por coincidencia exacta de palabras clave.
2. **Asistente Nexo AI**: Haz preguntas a tu base de conocimientos en tiempo real utilizando el modelo `Gemini 2.5 Flash`.
3. **Jerarquía de Carpetas y Tags**: Organiza tu conocimiento en estructuras flexibles de carpetas anidadas y etiquetas técnicas.
4. **Soporte Markdown Completo**: Tablas, bloques de código con resaltado sintáctico, diagramas Mermaid y renderizado KaTeX.
5. **Importación / Exportación Flexible**: Importa lotes de notas desde archivos `.zip`, `.pdf`, `.docx` o exporta tu workspace completo.

---

> 💡 **Tip**: Usa la barra lateral para explorar la estructura de carpetas o haz clic en el icono de **Nexo AI** para interactuar con tu asistente personal.
"""
    },
    {
        "title": "Arquitectura y RAG de NexoNotes",
        "folder": "Proyectos/NexoNotes",
        "tags": ["fastapi", "postgresql", "pgvector", "rag", "gemini", "arquitectura"],
        "content": """# Arquitectura y RAG de NexoNotes

**NexoNotes** es un sistema inteligente de gestión de notas técnicas en Markdown potenciado por Búsqueda Vectorial y Retrieval-Augmented Generation (RAG).

## 🏗️ Diagrama de Arquitectura

```mermaid
graph TD
    Client[Frontend React / Tailwind] -->|HTTP / REST| API[Backend FastAPI]
    API -->|SQLAlchemy| DB[(PostgreSQL + pgvector)]
    API -->|Embeddings & Chat| Gemini[Google Gemini API]
```

## 🚀 Componentes Clave

1. **Frontend**: React 18 con TypeScript, Tailwind CSS y Lucide Icons.
2. **Backend**: FastAPI (Python 3.11+) con arquitectura limpia y async handlers.
3. **Persistencia**: PostgreSQL 16 con la extensión `pgvector` para índice **HNSW** (Cosine Distance).
4. **Motor IA (Nexo)**: Google Gemini (`gemini-2.5-flash` y `text-embedding-004`).

## 📊 Configuración del Índice Vectorial

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE INDEX idx_notes_embedding 
ON notes 
USING hnsw (embedding vector_cosine_ops);
```

> **Nota**: El índice HNSW permite búsquedas de vecinos más cercanos (ANN) con latencias menores a 10ms incluso con cientos de miles de notas.
"""
    },
    {
        "title": "Roadmap de Desarrollo NexoNotes 2025",
        "folder": "Proyectos/NexoNotes",
        "tags": ["roadmap", "gestion", "nexonotes", "features"],
        "content": """# Roadmap de Desarrollo NexoNotes 2025

Estado general de las funcionalidades planificadas para las próximas iteraciones de NexoNotes.

## 📌 Progreso por Módulos

| Módulo | Funcionalidad | Estado | Prioridad |
| :--- | :--- | :---: | :---: |
| **Búsqueda Vectorial** | Extensión pgvector con HNSW | ✅ Completado | Alta |
| **Asistente Nexo** | RAG Contextual en Streaming | ✅ Completado | Alta |
| **Importación / Exportación** | Importación de `.zip`, `.pdf`, `.docx` | ✅ Completado | Media |
| **Organización** | Jerarquía de carpetas y tags | ✅ Completado | Alta |
| **Sincronización** | Sync Multidispositivo WebSockets | ⏳ En Progreso | Media |
| **Exportación PDF** | Exportar notas a PDF formateado | 📅 Planificado | Baja |

## 🎯 Próximos Pasos (Sprint Actual)

- [x] Optimizar la latencia del pipeline RAG a menos de 800ms.
- [x] Añadir soporte para renderizado de diagramas Mermaid en notas.
- [ ] Implementar vista en árbol expandible para carpetas anidadas.
- [ ] Soporte para atajos de teclado globales (`Ctrl+K` para búsqueda).

> Priorizar experiencia de lectura limpia y tiempo de respuesta inmediato en el asistente.
"""
    },
    {
        "title": "FastAPI & Pydantic v2 Best Practices",
        "folder": "Backend & APIs",
        "tags": ["python", "fastapi", "pydantic", "backend", "clean-code"],
        "content": """# FastAPI & Pydantic v2: Patrón de Diseño

Guía práctica para construir APIs robustas, mantenibles y de alto rendimiento utilizando FastAPI y Pydantic v2.

## 💡 Principios de Inyección de Dependencias

Utiliza el patrón `Depends` de FastAPI para desacoplar el ciclo de vida de la base de datos de las rutas HTTP:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import NoteResponse

router = APIRouter(prefix="/api/notes", tags=["Notes"])

@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: str, db: Session = Depends(get_db)):
    note = db.get(Note, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    return note
```

## ⚙️ Esquemas Pydantic v2 con ConfigDict

En Pydantic v2, la configuración se realiza mediante `ConfigDict` en lugar de una clase interna `Config`:

```python
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List, Optional

class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1)
    tags: List[str] = Field(default_factory=list)
    folder: Optional[str] = None

class NoteResponse(NoteBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```
"""
    },
    {
        "title": "PostgreSQL & pgvector Vector Search",
        "folder": "Backend & APIs",
        "tags": ["postgresql", "pgvector", "sql", "embeddings", "backend"],
        "content": """# PostgreSQL & pgvector: Búsqueda Semántica

`pgvector` es una extensión de código abierto para PostgreSQL que permite almacenar, indexar y consultar embeddings vectoriales directamente dentro de la base de datos relacional.

## 🔍 Consulta de Similitud por Coseno

La distancia coseno se calcula utilizando el operador `<=>`. Para convertir distancia en similitud:

$$\\text{Similitud Coseno} = 1 - \\text{Distancia Coseno}$$

```sql
SELECT 
    id, 
    title, 
    folder, 
    1 - (embedding <=> '[0.023, -0.041, 0.112, ...]'::vector) AS similarity
FROM notes
WHERE embedding IS NOT NULL
ORDER BY embedding <=> '[0.023, -0.041, 0.112, ...]'::vector ASC
LIMIT 5;
```

## 📈 Comparativa de Índices Vectoriales

| Índice | Velocidad de Inserción | Velocidad de Búsqueda | Consumo de RAM |
| :--- | :---: | :---: | :---: |
| **IVFFlat** | Rápida | Media | Bajo |
| **HNSW** | Moderada | Muy Rápida | Moderado |

> **Recomendación**: Para aplicaciones en tiempo real como NexoNotes, **HNSW** es la opción ideal debido a su rendimiento de lectura extremadamente ágil.
"""
    },
    {
        "title": "Guía de Diseño UI Dark Glassmorphism",
        "folder": "Frontend & UI",
        "tags": ["react", "tailwind", "ui-ux", "css", "frontend"],
        "content": """# Guía de Diseño UI: Dark Glassmorphism

Principios estéticos para la interfaz gráfica de NexoNotes inspirada en interfaces oscuras modernas con acentos en cian y violeta.

## 🎨 Paleta de Colores

- **Fondo Principal**: `#0b0f19` (Slate ultra oscuro)
- **Superficie de Tarjetas**: `rgba(15, 23, 42, 0.75)` con `backdrop-filter: blur(12px)`
- **Borde sutil**: `rgba(255, 255, 255, 0.08)`
- **Acento Primario**: Indigo / Cyan (`#6366f1` / `#06b6d4`)

## 💻 Clase de Componente Glassmorphic en Tailwind

```tsx
export const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`bg-slate-900/70 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-2xl transition-all hover:border-indigo-500/30 ${className}`}>
      {children}
    </div>
  );
};
```

## ✨ Recomendaciones de Tipografía

1. Usar fuentes Sans-Serif limpias (`Inter`, `Plus Jakarta Sans` o `Geist`).
2. Para código, utilizar fuentes Mono con ligaduras (`Fira Code` o `JetBrains Mono`).
"""
    },
    {
        "title": "Zustand State Management en React",
        "folder": "Frontend & UI",
        "tags": ["react", "zustand", "typescript", "frontend", "state"],
        "content": """# Manejo de Estado Global con Zustand

Zustand proporciona una solución ligera, rápida y sin boilerplate para gestionar el estado global en React.

## ⚡ Implementación del Store de Notas

```typescript
import { create } from 'zustand';

interface Note {
  id: string;
  title: string;
  content: string;
  folder?: string;
  tags: string[];
}

interface NoteState {
  notes: Note[];
  selectedFolder: string | null;
  activeNoteId: string | null;
  setNotes: (notes: Note[]) => void;
  setSelectedFolder: (folder: string | null) => void;
  setActiveNoteId: (id: string | null) => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  selectedFolder: null,
  activeNoteId: null,
  setNotes: (notes) => set({ notes }),
  setSelectedFolder: (folder) => set({ selectedFolder: folder }),
  setActiveNoteId: (activeNoteId) => set({ activeNoteId }),
}));
```
"""
    },
    {
        "title": "Fundamentos de RAG (Retrieval-Augmented Generation)",
        "folder": "Inteligencia Artificial",
        "tags": ["ai", "rag", "embeddings", "llm", "gemini"],
        "content": """# Fundamentos de RAG (Retrieval-Augmented Generation)

RAG es una técnica que combina el poder de generación de los modelos de lenguaje (LLMs) con la precisión de bases de conocimiento privadas o externas.

## 🔄 El Flujo de Trabajo RAG

1. **Ingesta**: Separación del contenido en fragmentos (chunking) y generación de embeddings.
2. **Almacenamiento**: Persistencia de vectores en base de datos vectorial (`pgvector`).
3. **Recuperación**: Búsqueda por similitud coseno entre la consulta del usuario y los fragmentos guardados.
4. **Síntesis**: Inyección del contexto relevante en el prompt del LLM (`Gemini 2.5 Flash`) para generar una respuesta fundamentada.

> **Ventaja Clave**: Evita alucinaciones del modelo y permite consultar información actualizada en tiempo real sin reentrenar el LLM.
"""
    },
    {
        "title": "Modelos Gemini & Vector Embeddings",
        "folder": "Inteligencia Artificial",
        "tags": ["gemini", "google-ai", "embeddings", "ai"],
        "content": """# Modelos Gemini & Vector Embeddings

Análisis técnico de los modelos de Google Gemini integrados en la plataforma NexoNotes.

## 🤖 Modelos Utilizados

### 1. `text-embedding-004`
- **Dimensión vectorial**: 768 dimensiones.
- **Caso de uso**: Generación de representación semántica para notas y consultas.
- **Normalización**: Embeddings normalizados para cálculo eficiente de similitud coseno.

### 2. `gemini-2.5-flash` / `gemini-3.5-flash-lite`
- **Ventana de Contexto**: Más de 1M tokens.
- **Velocidad**: Respuesta ultrarrápida optimizada para chat conversacional.
- **Capacidad**: Extracción de datos, resúmenes técnicos y análisis de código.

```python
# Ejemplo de llamada embedding con la SDK de google-genai
from google import genai

client = genai.Client(api_key="TU_API_KEY")
response = client.models.embed_content(
    model="text-embedding-004",
    contents="FastAPI es un framework web moderno y rápido para Python."
)
embedding = response.embedding.values
```
"""
    },
    {
        "title": "Prompts & Agentic Workflows",
        "folder": "Inteligencia Artificial",
        "tags": ["ai", "prompts", "agents", "llm"],
        "content": """# Patrones de Prompting y Agentes Autónomos

Los workflows agénticos permiten descomponer tareas complejas en pasos ejecutados por LLMs coordinados.

## 🧠 Arquitectura ReAct (Reason + Act)

```
[Usuario] -> (Pensamiento) -> (Acción: Herramienta) -> (Observación) -> [Respuesta Final]
```

## 📋 Lista de Principios de Diseños de Prompts

- **System Prompts Claros**: Define explícitamente el rol, restricciones y formato de salida deseado.
- **In-Context Examples**: Proporciona 2 o 3 ejemplos de Few-Shot para asegurar respuestas estructuradas.
- **Validación Sintáctica**: Solicita respuestas en JSON válido con esquemas estrictos cuando sea necesario procesar programmaticamente.
"""
    },
    {
        "title": "Guía Completa de Docker Compose",
        "folder": "DevOps & Cloud",
        "tags": ["docker", "devops", "containers", "postgresql"],
        "content": """# Guía Completa de Docker Compose en NexoNotes

Despliegue multi-contenedor optimizado para entornos de desarrollo y producción local.

## 🐳 Estructura de Servicios

```yaml
services:
  db:
    image: pgvector/pgvector:pg16
    container_name: nexonotes-db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nexonotes_admin -d nexonotes_db"]
      interval: 4s
      timeout: 5s
      retries: 15

  backend:
    build: ./backend
    container_name: nexonotes-backend
    ports:
      - "8780:8000"
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build: ./frontend
    container_name: nexonotes-frontend
    ports:
      - "3780:80"
```

## 🛠️ Comandos Frecuentes

- **Iniciar entorno**: `docker compose up -d --build`
- **Ver logs en tiempo real**: `docker compose logs -f backend`
- **Reiniciar base de datos**: `docker compose down -v`
"""
    },
    {
        "title": "CI-CD Pipelines con GitHub Actions",
        "folder": "DevOps & Cloud",
        "tags": ["devops", "github-actions", "ci-cd", "docker"],
        "content": """# CI/CD Pipelines con GitHub Actions

Automatización de pruebas unitarias, linting de código y construcción de imágenes Docker en cada Pull Request.

## 🛠️ Workflow de Integración Continua

```yaml
name: Continuous Integration

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r backend/requirements.txt pytest
      - name: Run Pytest
        run: |
          pytest backend/app/tests
```
"""
    },
    {
        "title": "Markdown CheatSheet & Formato",
        "folder": "Guias & CheatSheets",
        "tags": ["cheatsheet", "markdown", "documentacion", "guias"],
        "content": """# Markdown CheatSheet: Guía de Estilo

Ejemplos de los elementos Markdown soportados en el editor y visor de NexoNotes.

## 📝 Texto y Énfasis

- **Negrita**: `**texto**` -> **texto**
- *Cursiva*: `*texto*` -> *texto*
- ~~Tachado~~: `~~texto~~` -> ~~texto~~
- `Código Inline`: `` `código` ``

## 💡 Bloques de Cita (Callouts)

> ℹ️ **Información**: NexoNotes sincroniza automáticamente tus vectores al guardar cualquier cambio en la nota.

> ⚠️ **Advertencia**: Asegúrate de tener configurada la variable `GEMINI_API_KEY` en el archivo `.env`.

## 📊 Tablas de Datos

| Comando | Descripción | Tecla Rápida |
| :--- | :--- | :---: |
| `/nexo` | Consultar asistente IA | `Ctrl + Shift + N` |
| `/search` | Búsqueda por texto o vector | `Ctrl + F` |
| `/export` | Exportar notas a ZIP | `Ctrl + E` |

## 🧮 Ecuaciones Matemáticas (KaTeX)

Fórmula de similitud coseno:

$$\\text{cosine\\_similarity}(A, B) = \\frac{A \\cdot B}{\\|A\\| \\|B\\|}$$
"""
    },
    {
        "title": "Comandos Útiles de Terminal & Git",
        "folder": "Guias & CheatSheets",
        "tags": ["git", "bash", "cheatsheet", "terminal", "devops"],
        "content": """# Comandos Útiles de Terminal & Git

Colección de comandos esenciales para desarrollo diario en Linux, macOS y Git.

## 🔀 Operaciones Git Avanzadas

```bash
# Deshacer el último commit manteniendo cambios en staging
git reset --soft HEAD~1

# Limpiar ramas locales eliminadas en el servidor remoto
git fetch --prune && git branch -vv | grep ': gone]' | awk '{print $1}' | xargs git branch -D

# Aplicar commit específico de otra rama
git cherry-pick <commit-hash>
```

## 🐧 Diagnóstico de Red y Puertos

```bash
# Verificar qué proceso ocupa un puerto en Linux/macOS
lsof -i :8780

# Probar conexión HTTP con headers completos
curl -i -X GET http://localhost:8780/health
```
"""
    }
]

def seed():
    try:
        res = urllib.request.urlopen('http://localhost:8780/api/notes')
        existing = json.loads(res.read().decode('utf-8'))
        if existing:
            print(f"Borrando {len(existing)} notas preexistentes...")
            for old_n in existing:
                del_req = urllib.request.Request(f"http://localhost:8780/api/notes/{old_n['id']}", method="DELETE")
                urllib.request.urlopen(del_req)
            print("Base de datos limpia.")
    except Exception as e:
        print(f"Error al limpiar notas: {e}")

    print(f"Cargando {len(NOTES)} notas reales de prueba en NexoNotes...")
    success_count = 0
    for idx, note in enumerate(NOTES, 1):
        req = urllib.request.Request(
            'http://localhost:8780/api/notes',
            data=json.dumps(note).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        try:
            res = urllib.request.urlopen(req)
            if res.status == 201:
                res_data = json.loads(res.read().decode('utf-8'))
                has_emb = res_data.get('has_embedding', False)
                folder_str = note['folder'] or '(Raiz)'
                print(f"[{idx}/{len(NOTES)}] [OK] Creada: '{note['title']}' en '{folder_str}' (Vectorizado: {has_emb})")
                success_count += 1
            else:
                print(f"[{idx}/{len(NOTES)}] [FAIL] HTTP {res.status}: {note['title']}")
        except Exception as e:
            print(f"[{idx}/{len(NOTES)}] [ERROR] Al enviar '{note['title']}': {e}")
        time.sleep(0.3)

    print(f"\nProceso finalizado: Se cargaron exitosamente {success_count} de {len(NOTES)} notas.")

if __name__ == "__main__":
    seed()
