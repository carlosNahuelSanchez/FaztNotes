from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, func
from app.database import get_db
from app.models import Note
from app.schemas import NoteCreate, NoteUpdate, NoteResponse
from app.services.rag import sync_note_embedding

router = APIRouter(prefix="/api/notes", tags=["Notes"])


def to_note_response(note: Note) -> NoteResponse:
    return NoteResponse(
        id=note.id,
        title=note.title,
        content=note.content,
        tags=note.tags or [],
        folder=note.folder,
        created_at=note.created_at,
        updated_at=note.updated_at,
        has_embedding=note.embedding is not None
    )


@router.get("", response_model=List[NoteResponse])
def list_notes(
    search: Optional[str] = Query(None, description="Termino de busqueda textual"),
    tag: Optional[str] = Query(None, description="Filtro por etiqueta"),
    folder: Optional[str] = Query(None, description="Filtro por carpeta (__root__ para raiz)"),
    db: Session = Depends(get_db)
):
    stmt = select(Note)

    if search:
        pattern = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Note.title.ilike(pattern),
                Note.content.ilike(pattern)
            )
        )

    if tag:
        stmt = stmt.where(Note.tags.contains([tag.strip()]))

    if folder is not None:
        if folder == "__root__" or folder == "":
            stmt = stmt.where(or_(Note.folder.is_(None), Note.folder == ""))
        else:
            stmt = stmt.where(Note.folder == folder.strip())

    stmt = stmt.order_by(Note.updated_at.desc())
    notes = db.execute(stmt).scalars().all()
    return [to_note_response(n) for n in notes]


@router.get("/tags", response_model=List[str])
def list_tags(db: Session = Depends(get_db)):
    stmt = select(func.unnest(Note.tags).label("tag")).distinct()
    results = db.execute(stmt).scalars().all()
    clean_tags = sorted(list({t for t in results if t}))
    return clean_tags


@router.get("/folders", response_model=List[str])
def list_folders(db: Session = Depends(get_db)):
    stmt = select(Note.folder).distinct()
    results = db.execute(stmt).scalars().all()
    clean_folders = sorted(list({f.strip() for f in results if f and f.strip()}))
    return clean_folders


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: str, db: Session = Depends(get_db)):
    note = db.get(Note, note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nota con ID '{note_id}' no encontrada."
        )
    return to_note_response(note)


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(payload: NoteCreate, db: Session = Depends(get_db)):
    clean_tags = [t.strip() for t in payload.tags if t.strip()]
    clean_folder = payload.folder.strip() if payload.folder and payload.folder.strip() else None

    new_note = Note(
        title=payload.title.strip(),
        content=payload.content.strip(),
        tags=clean_tags,
        folder=clean_folder
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    # Ingesta y vectorizacion inmediata
    sync_note_embedding(db, new_note)
    db.refresh(new_note)

    return to_note_response(new_note)


@router.put("/{note_id}", response_model=NoteResponse)
def update_note(note_id: str, payload: NoteUpdate, db: Session = Depends(get_db)):
    note = db.get(Note, note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nota con ID '{note_id}' no encontrada."
        )

    changed = False
    re_embed = False

    if payload.title is not None and payload.title.strip() != note.title:
        note.title = payload.title.strip()
        changed = True
        re_embed = True

    if payload.content is not None and payload.content.strip() != note.content:
        note.content = payload.content.strip()
        changed = True
        re_embed = True

    if payload.tags is not None:
        clean_tags = [t.strip() for t in payload.tags if t.strip()]
        if clean_tags != note.tags:
            note.tags = clean_tags
            changed = True
            re_embed = True

    if payload.folder is not None:
        clean_folder = payload.folder.strip() if payload.folder.strip() else None
        if clean_folder != note.folder:
            note.folder = clean_folder
            changed = True

    if changed:
        db.add(note)
        db.commit()
        db.refresh(note)

        # Si cambio contenido, titulo o tags, regenerar vector de inmediato
        if re_embed:
            sync_note_embedding(db, note)
            db.refresh(note)

    return to_note_response(note)


@router.delete("/{note_id}", status_code=status.HTTP_200_OK)
def delete_note(note_id: str, db: Session = Depends(get_db)):
    note = db.get(Note, note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nota con ID '{note_id}' no encontrada."
        )

    db.delete(note)
    db.commit()
    return {"status": "ok", "deleted_id": note_id}
