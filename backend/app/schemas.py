from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="Titulo de la nota (max 100 caracteres)")
    content: str = Field(..., min_length=1, description="Cuerpo de la nota en Markdown (sin limite de caracteres)")
    tags: List[str] = Field(default_factory=list, description="Lista de etiquetas tecnicas")
    folder: Optional[str] = Field(None, max_length=60, description="Carpeta contenedora (max 60 caracteres)")


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    content: Optional[str] = Field(None, min_length=1)
    tags: Optional[List[str]] = None
    folder: Optional[str] = Field(None, max_length=60)


class NoteResponse(NoteBase):
    id: str
    created_at: datetime
    updated_at: datetime
    has_embedding: bool = False
    embedding_error: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class NoteImportResult(BaseModel):
    success: bool
    imported_count: int
    notes: List[NoteResponse] = Field(default_factory=list)
    note: Optional[NoteResponse] = None
    warnings: List[str] = Field(default_factory=list)


class NexoQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500, description="Consulta para Nexo (max 500 caracteres)")
    top_k: Optional[int] = Field(4, ge=1, le=20, description="Cantidad maxima de fragmentos a recuperar")


class NexoSource(BaseModel):
    id: str
    title: str
    similarity: float
    content_snippet: str


class NexoQueryResponse(BaseModel):
    query: str
    answer: str
    sources: List[NexoSource]
    latency_ms: float


class HealthResponse(BaseModel):
    status: str
    database: str
    gemini_configured: bool
    total_notes: int
