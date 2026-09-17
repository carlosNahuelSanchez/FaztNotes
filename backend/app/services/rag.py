import logging
import time
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models import Note
from app.schemas import NexoQueryResponse, NexoSource
from app.services.gemini import gemini_service

logger = logging.getLogger("nexonotes.rag")


def format_note_for_embedding(title: str, content: str, tags: List[str]) -> str:
    tags_str = ", ".join(tags) if tags else "ninguna"
    return f"TITULO: {title}\nETIQUETAS: {tags_str}\n\nCONTENIDO:\n{content}"


def sync_note_embedding(db: Session, note: Note) -> Tuple[bool, Optional[str]]:
    # ponytail: Return explicit error message to frontend without complex error wrappers
    if not gemini_service.is_configured():
        msg = "GEMINI_API_KEY no configurada en el sistema. La nota se guardó sin vectorizar."
        logger.warning(f"[NEXONOTES-RAG] {msg} (Nota: {note.id})")
        return False, msg

    try:
        text_payload = format_note_for_embedding(
            title=note.title,
            content=note.content,
            tags=note.tags or []
        )
        embedding = gemini_service.generate_embedding(text_payload)
        note.embedding = embedding
        db.add(note)
        db.commit()
        db.refresh(note)
        logger.info(f"[NEXONOTES-RAG] Embedding generado y persistido para nota ID: {note.id}")
        return True, None
    except Exception as exc:
        err_msg = f"Error al generar embedding con Gemini: {str(exc)}"
        logger.error(f"[NEXONOTES-RAG] {err_msg} (Nota ID: {note.id})")
        db.rollback()
        return False, err_msg


def retrieve_similar_notes(
    db: Session,
    query: str,
    top_k: int = 4
) -> List[Tuple[Note, float]]:
    if not gemini_service.is_configured():
        logger.warning("[NEXONOTES-RAG] Gemini no configurado; no es posible vectorizar query.")
        return []

    query_vector = gemini_service.generate_query_embedding(query)

    # Cosine distance in pgvector: Note.embedding.cosine_distance(query_vector)
    # Cosine similarity = 1 - cosine_distance
    distance_col = Note.embedding.cosine_distance(query_vector).label("distance")

    stmt = (
        select(Note, distance_col)
        .where(Note.embedding.is_not(None))
        .order_by(distance_col.asc())
        .limit(top_k)
    )

    results = db.execute(stmt).all()
    output: List[Tuple[Note, float]] = []

    for note, dist in results:
        dist_val = float(dist) if dist is not None else 1.0
        similarity = max(0.0, min(1.0, 1.0 - dist_val))
        output.append((note, similarity))

    return output


def execute_nexo_rag(
    db: Session,
    query: str,
    top_k: int = 4
) -> NexoQueryResponse:
    start_time = time.perf_counter()

    if not gemini_service.is_configured():
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return NexoQueryResponse(
            query=query,
            answer="Error operativo: GEMINI_API_KEY no se encuentra configurada en el entorno.",
            sources=[],
            latency_ms=elapsed_ms
        )

    matched_notes = retrieve_similar_notes(db, query, top_k=top_k)

    if not matched_notes:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return NexoQueryResponse(
            query=query,
            answer="No hay información en las notas sobre este tema.",
            sources=[],
            latency_ms=elapsed_ms
        )

    # Construir contexto formal para inyeccion directa en Nexo
    context_blocks = []
    sources: List[NexoSource] = []

    for note, similarity in matched_notes:
        snippet = note.content[:240].strip()
        if len(note.content) > 240:
            snippet += "..."

        sources.append(
            NexoSource(
                id=str(note.id),
                title=note.title,
                similarity=round(similarity, 4),
                content_snippet=snippet
            )
        )

        tags_str = ", ".join(note.tags) if note.tags else "ninguna"
        folder_str = note.folder or "raiz"
        block = (
            f"[ID NOTA: {note.id}]\n"
            f"[TITULO: {note.title}]\n"
            f"[CARPETA: {folder_str}]\n"
            f"[ETIQUETAS: {tags_str}]\n"
            f"[RELEVANCIA: {similarity:.4f}]\n"
            f"[CONTENIDO]:\n{note.content}\n"
        )
        context_blocks.append(block)

    full_context = "\n---\n".join(context_blocks)

    try:
        answer = gemini_service.generate_nexo_response(query=query, context=full_context)
    except Exception as exc:
        answer = f"Error en generacion de respuesta Nexo: {str(exc)}"

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return NexoQueryResponse(
        query=query,
        answer=answer,
        sources=sources,
        latency_ms=elapsed_ms
    )


def stream_nexo_rag(
    db: Session,
    query: str,
    top_k: int = 4
):
    import json
    start_time = time.perf_counter()

    if not gemini_service.is_configured():
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        yield f"event: sources\ndata: {json.dumps({'sources': []})}\n\n"
        yield f"event: chunk\ndata: {json.dumps({'text': 'Error operativo: Motor de IA no configurado en el entorno.'})}\n\n"
        yield f"event: done\ndata: {json.dumps({'latency_ms': elapsed_ms})}\n\n"
        return

    matched_notes = retrieve_similar_notes(db, query, top_k=top_k)

    if not matched_notes:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        yield f"event: sources\ndata: {json.dumps({'sources': []})}\n\n"
        yield f"event: chunk\ndata: {json.dumps({'text': 'No hay información en las notas sobre este tema.'})}\n\n"
        yield f"event: done\ndata: {json.dumps({'latency_ms': elapsed_ms})}\n\n"
        return

    sources = []
    context_blocks = []
    for note, similarity in matched_notes:
        snippet = note.content[:240].strip()
        if len(note.content) > 240:
            snippet += "..."
        sources.append({
            "id": str(note.id),
            "title": note.title,
            "similarity": round(similarity, 4),
            "content_snippet": snippet
        })
        tags_str = ", ".join(note.tags) if note.tags else "ninguna"
        folder_str = note.folder or "raiz"
        block = (
            f"[ID NOTA: {note.id}]\n"
            f"[TITULO: {note.title}]\n"
            f"[CARPETA: {folder_str}]\n"
            f"[ETIQUETAS: {tags_str}]\n"
            f"[RELEVANCIA: {similarity:.4f}]\n"
            f"[CONTENIDO]:\n{note.content}\n"
        )
        context_blocks.append(block)

    full_context = "\n---\n".join(context_blocks)

    # Enviar fuentes recuperadas primero
    yield f"event: sources\ndata: {json.dumps({'sources': sources})}\n\n"

    # Enviar streaming de texto generado por Nexo
    for chunk in gemini_service.generate_nexo_stream(query=query, context=full_context):
        yield f"event: chunk\ndata: {json.dumps({'text': chunk})}\n\n"

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    yield f"event: done\ndata: {json.dumps({'latency_ms': elapsed_ms})}\n\n"
