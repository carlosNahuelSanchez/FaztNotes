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
logger = logging.getLogger("faztnotes")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[FAZTNOTES-SYS] Iniciando ciclo de vida del backend...")
    try:
        init_db()
        logger.info("[FAZTNOTES-SYS] Base de datos y extension pgvector listas para operar.")
    except Exception as exc:
        logger.critical(f"[FAZTNOTES-SYS] Error critico en inicializacion de base de datos: {exc}")
    yield
    logger.info("[FAZTNOTES-SYS] Deteniendo backend de forma limpia...")


app = FastAPI(
    title="FaztNotes API",
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
    logger.error(f"[FAZTNOTES-ERR] Error no controlado en {request.url.path}: {exc}")
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
        logger.error(f"[FAZTNOTES-HEALTH] Error verificando estado de BD: {exc}")
        db_status = f"error: {str(exc)}"

    return HealthResponse(
        status="ok" if db_status == "connected" else "degraded",
        database=db_status,
        gemini_configured=gemini_service.is_configured(),
        total_notes=total_notes
    )


app.include_router(notes.router)
app.include_router(nexo.router)
