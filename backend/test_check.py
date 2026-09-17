"""Self-check validation test for NexoNotes backend.
Tests non-trivial logic: schema validation, prompt formatting, and RAG context construction.
"""
from app.schemas import NoteCreate, NoteUpdate, NexoQueryRequest, NexoSource, NexoQueryResponse
from app.services.rag import format_note_for_embedding


def test_schema_validations():
    # Valid NoteCreate
    note = NoteCreate(title="Test Note", content="# Heading\nBody text", tags=["rag", "pgvector"])
    assert note.title == "Test Note"
    assert note.tags == ["rag", "pgvector"]

    # Valid NexoQueryRequest
    query_req = NexoQueryRequest(query="¿Como funciona pgvector?", top_k=4)
    assert query_req.top_k == 4

    # NexoSource & NexoQueryResponse
    source = NexoSource(
        id="test-uuid",
        title="Doc",
        similarity=0.92,
        content_snippet="Snippet..."
    )
    res = NexoQueryResponse(
        query=query_req.query,
        answer="Respuesta técnica basada en [Fuente: Doc (test-uuid)].",
        sources=[source],
        latency_ms=120.5
    )
    assert len(res.sources) == 1
    assert res.latency_ms == 120.5


def test_embedding_formatting():
    formatted = format_note_for_embedding(
        title="Microservicios",
        content="Arquitectura distribuida",
        tags=["arch", "docker"]
    )
    assert "TITULO: Microservicios" in formatted
    assert "ETIQUETAS: arch, docker" in formatted
    assert "CONTENIDO:\nArquitectura distribuida" in formatted


if __name__ == "__main__":
    test_schema_validations()
    test_embedding_formatting()
    print("[TEST-CHECK: OK] Todas las aserciones de esquemas y formateo pasaron con exito.")
