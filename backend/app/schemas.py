from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Titulo de la nota")
    content: str = Field(..., min_length=1, description="Cuerpo de la nota en formato Markdown")
    tags: List[str] = Field(default_factory=list, description="Lista de etiquetas tecnicas")
    folder: Optional[str] = Field(None, max_length=100, description="Carpeta contenedora")


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    tags: Optional[List[str]] = None
    folder: Optional[str] = None


class NoteResponse(NoteBase):
    id: str
    created_at: datetime
    updated_at: datetime
    has_embedding: bool = False

    model_config = ConfigDict(from_attributes=True)


class NexoQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="Consulta para el asistente Nexo")
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
