import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import init_db, get_db
from app.schemas import HealthResponse
from app.services.gemini import gemini_service
from app.routers import notes, nexo

# Configuracion de logging estructurado sobrio
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("nexonotes")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[NEXONOTES-SYS] Iniciando ciclo de vida del backend...")
    try:
        init_db()
        logger.info("[NEXONOTES-SYS] Base de datos y extension pgvector listas para operar.")
    except Exception as exc:
        logger.critical(f"[NEXONOTES-SYS] Error critico en inicializacion de base de datos: {exc}")
    yield
    logger.info("[NEXONOTES-SYS] Deteniendo backend de forma limpia...")


app = FastAPI(
    title="NexoNotes API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"[NEXONOTES-ERR] Error no controlado en {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "INTERNAL_SERVER_ERROR", "detail": str(exc)}
    )


@app.get("/health", response_model=HealthResponse, tags=["System"])
@app.get("/api/health", response_model=HealthResponse, tags=["System"])
def health_check(db: Session = Depends(get_db)):
    db_status = "error"
    total_notes = 0
    try:
        db.execute(text("SELECT 1"))
        result = db.execute(text("SELECT COUNT(*) FROM notes")).scalar()
        total_notes = int(result) if result is not None else 0
        db_status = "connected"
    except Exception as exc:
        logger.error(f"[NEXONOTES-HEALTH] Error verificando estado de BD: {exc}")
        db_status = f"error: {str(exc)}"

    return HealthResponse(
        status="ok" if db_status == "connected" else "degraded",
        database=db_status,
        gemini_configured=gemini_service.is_configured(),
        total_notes=total_notes
    )

# ponytail: raw SQL aggregate — no ORM overhead, no extra schema
@app.get("/api/stats", tags=["System"])
def system_stats(db: Session = Depends(get_db)):
    try:
        total = int(db.execute(text("SELECT COUNT(*) FROM notes")).scalar() or 0)
        with_emb = int(db.execute(text("SELECT COUNT(*) FROM notes WHERE embedding IS NOT NULL")).scalar() or 0)
        pct = round((with_emb / total * 100) if total > 0 else 0, 1)

        folders_rows = db.execute(text(
            "SELECT COALESCE(NULLIF(folder,''),'/') as f, COUNT(*) as c FROM notes GROUP BY f ORDER BY c DESC"
        )).fetchall()
        tags_rows = db.execute(text(
            "SELECT tag, COUNT(*) as c FROM (SELECT unnest(tags) as tag FROM notes) t WHERE tag IS NOT NULL AND tag != '' GROUP BY tag ORDER BY c DESC"
        )).fetchall()
        activity_rows = db.execute(text(
            "SELECT TO_CHAR(COALESCE(updated_at, created_at), 'YYYY-MM-DD') as d, COUNT(*) as c FROM notes WHERE COALESCE(updated_at, created_at) >= NOW() - INTERVAL '14 days' GROUP BY d ORDER BY d ASC"
        )).fetchall()

        # Detailed notes per date in last 14 days
        recent_notes_rows = db.execute(text(
            "SELECT id, title, COALESCE(folder, '') as folder, tags, TO_CHAR(COALESCE(updated_at, created_at), 'YYYY-MM-DD') as d FROM notes WHERE COALESCE(updated_at, created_at) >= NOW() - INTERVAL '14 days' ORDER BY COALESCE(updated_at, created_at) DESC"
        )).fetchall()
        notes_by_date = {}
        for r in recent_notes_rows:
            d_key = r[4]
            if d_key not in notes_by_date:
                notes_by_date[d_key] = []
            notes_by_date[d_key].append({"id": str(r[0]), "title": r[1], "folder": r[2], "tags": r[3] or []})

        total_folders = int(db.execute(text("SELECT COUNT(DISTINCT folder) FROM notes WHERE folder IS NOT NULL AND folder != ''")).scalar() or 0)
        total_tags = int(db.execute(text("SELECT COUNT(DISTINCT tag) FROM (SELECT unnest(tags) as tag FROM notes) t WHERE tag IS NOT NULL AND tag != ''")).scalar() or 0)

        return {
            "total_notes": total,
            "total_with_embedding": with_emb,
            "embedding_coverage_pct": pct,
            "total_folders": total_folders,
            "total_tags": total_tags,
            "notes_by_folder": [{"folder": r[0], "count": r[1]} for r in folders_rows],
            "notes_by_tag": [{"tag": r[0], "count": r[1]} for r in tags_rows],
            "recent_activity": [
                {"date": r[0], "count": r[1], "notes": notes_by_date.get(r[0], [])} for r in activity_rows
            ],
        }
    except Exception as exc:
        logger.error(f"[NEXONOTES-STATS] Error: {exc}")
        return {"error": str(exc)}


app.include_router(notes.router)
app.include_router(nexo.router)
