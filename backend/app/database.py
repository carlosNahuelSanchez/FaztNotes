import logging
import time
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

logger = logging.getLogger("faztnotes.database")

engine = create_engine(
    settings.sync_database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(max_retries: int = 15, delay_seconds: int = 2) -> None:
    logger.info("[FAZTNOTES-DB] Iniciando verificacion de conexion con PostgreSQL...")
    connected = False
    for attempt in range(1, max_retries + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                conn.commit()
            connected = True
            logger.info(f"[FAZTNOTES-DB] Conexion exitosa en intento {attempt}.")
            break
        except Exception as exc:
            logger.warning(
                f"[FAZTNOTES-DB] Intento {attempt}/{max_retries} fallido: {exc}. Reintentando en {delay_seconds}s..."
            )
            time.sleep(delay_seconds)

    if not connected:
        raise RuntimeError("[FAZTNOTES-DB] Error critico: No fue posible conectar con PostgreSQL.")

    with engine.connect() as conn:
        logger.info("[FAZTNOTES-DB] Asegurando extension 'vector' en PostgreSQL...")
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()

    logger.info("[FAZTNOTES-DB] Creando tablas si no existen...")
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        logger.info("[FAZTNOTES-DB] Creando indice HNSW para busqueda coseno si no existe...")
        conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS idx_notes_embedding "
                "ON notes USING hnsw (embedding vector_cosine_ops);"
            )
        )
        conn.commit()

    logger.info("[FAZTNOTES-DB] Inicializacion de base de datos relacional y vectorial completada.")
