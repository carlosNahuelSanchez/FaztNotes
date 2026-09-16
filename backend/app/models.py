import uuid
from sqlalchemy import Column, String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import ARRAY
from pgvector.sqlalchemy import Vector
from app.database import Base


class Note(Base):
    __tablename__ = "notes"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True
    )
    title = Column(String(255), nullable=False, index=True)
    content = Column(Text, nullable=False)
    tags = Column(ARRAY(String), default=list, nullable=False)
    folder = Column(String(100), nullable=True, default=None, index=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    embedding = Column(Vector(768), nullable=True)

    def __repr__(self) -> str:
        return f"<Note id={self.id} title={self.title[:20]}>"
