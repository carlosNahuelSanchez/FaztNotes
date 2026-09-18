import io
import os
import re
import logging
import tempfile
import zipfile
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, func
from app.database import get_db
from app.models import Note
from app.schemas import NoteCreate, NoteUpdate, NoteResponse, NoteImportResult, FolderRenamePayload
from app.services.rag import sync_note_embedding

logger = logging.getLogger("nexonotes.notes")
router = APIRouter(prefix="/api/notes", tags=["Notes"])

ALLOWED_EXTENSIONS = {".md", ".markdown", ".txt", ".docx", ".pdf"}


def sanitize_filename(name: str) -> str:
    cleaned = re.sub(r'[\\/*?:"<>|]', '_', name.strip())
    return cleaned or "documento"


def convert_to_markdown(content_bytes: bytes, ext_lower: str, filename: str) -> str:
    if ext_lower in [".md", ".markdown", ".txt"]:
        try:
            return content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return content_bytes.decode("latin-1", errors="replace")
    elif ext_lower in [".docx", ".pdf"]:
        from markitdown import MarkItDown
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext_lower) as tmp:
            tmp.write(content_bytes)
            tmp_path = tmp.name
        try:
            md_converter = MarkItDown()
            result = md_converter.convert(tmp_path)
            return (result.text_content or "").strip()
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    else:
        raise ValueError(f"Extension no soportada: {ext_lower}")


def to_note_response(note: Note, embedding_error: Optional[str] = None) -> NoteResponse:
    # ponytail: Return model instance with optional error string directly
    return NoteResponse(
        id=note.id,
        title=note.title,
        content=note.content,
        tags=note.tags or [],
        folder=note.folder,
        created_at=note.created_at,
        updated_at=note.updated_at,
        has_embedding=note.embedding is not None,
        embedding_error=embedding_error
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
            f_clean = folder.strip()
            stmt = stmt.where(
                or_(
                    Note.folder == f_clean,
                    Note.folder.like(f"{f_clean}/%")
                )
            )

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


@router.get("/export/folder")
def export_folder_zip(
    folder: Optional[str] = Query(None, description="Ruta de carpeta a exportar como ZIP. Si se omite, exporta todo."),
    db: Session = Depends(get_db)
):
    stmt = select(Note)
    clean_folder = folder.strip() if folder and folder.strip() else None
    if clean_folder:
        stmt = stmt.where(or_(Note.folder == clean_folder, Note.folder.like(f"{clean_folder}/%")))

    notes = db.execute(stmt).scalars().all()
    if not notes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontraron notas en la ubicacion solicitada para exportar."
        )

    zip_buffer = io.BytesIO()
    seen_paths = set()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for note in notes:
            if clean_folder:
                if note.folder == clean_folder:
                    rel_dir = ""
                elif note.folder and note.folder.startswith(clean_folder + "/"):
                    rel_dir = note.folder[len(clean_folder) + 1:]
                else:
                    rel_dir = ""
            else:
                rel_dir = note.folder or ""

            base_title = sanitize_filename(note.title)
            file_name = f"{base_title}.md"
            zip_path = os.path.join(rel_dir, file_name).replace("\\", "/").lstrip("/")

            counter = 1
            while zip_path in seen_paths:
                counter += 1
                file_name = f"{base_title}_{counter}.md"
                zip_path = os.path.join(rel_dir, file_name).replace("\\", "/").lstrip("/")

            seen_paths.add(zip_path)
            zf.writestr(zip_path, note.content.encode("utf-8"))

    zip_buffer.seek(0)
    safe_name = sanitize_filename(clean_folder.replace("/", "_") if clean_folder else "nexonotes_workspace")
    return Response(
        content=zip_buffer.getvalue(),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_name}.zip"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: str, db: Session = Depends(get_db)):
    note = db.get(Note, note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nota con ID '{note_id}' no encontrada."
        )
    return to_note_response(note)


@router.get("/{note_id}/export")
def export_note_file(note_id: str, db: Session = Depends(get_db)):
    note = db.get(Note, note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nota con ID '{note_id}' no encontrada."
        )

    safe_title = sanitize_filename(note.title)
    return Response(
        content=note.content.encode("utf-8"),
        media_type="text/markdown; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_title}.md"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


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
    _, emb_err = sync_note_embedding(db, new_note)
    db.refresh(new_note)

    return to_note_response(new_note, embedding_error=emb_err)


@router.post("/import", response_model=NoteImportResult, status_code=status.HTTP_201_CREATED)
async def import_note_file(
    file: UploadFile = File(...),
    folder: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    original_filename = file.filename or "documento"
    _, ext = os.path.splitext(original_filename)
    ext_lower = ext.lower()

    if ext_lower not in ALLOWED_EXTENSIONS and ext_lower != ".zip":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"El archivo '{original_filename}' no corresponde a un archivo permitido en el sistema "
                "(por ejemplo, imagenes o presentaciones PowerPoint). "
                "Formatos permitidos: Markdown (.md, .txt), Word (.docx), PDF (.pdf) o archivos comprimidos (.zip)."
            )
        )

    content_bytes = await file.read()
    if not content_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo enviado esta vacio."
        )

    parsed_tags = []
    if tags:
        parsed_tags = [t.strip() for t in tags.split(",") if t.strip()]

    clean_base_folder = folder.strip() if folder and folder.strip() else None

    # Caso A: Archivo ZIP
    if ext_lower == ".zip":
        try:
            zip_buffer = io.BytesIO(content_bytes)
            zf = zipfile.ZipFile(zip_buffer, "r")
        except zipfile.BadZipFile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El archivo '{original_filename}' no es un archivo ZIP valido."
            )

        imported_notes = []
        warnings = []

        for info in zf.infolist():
            if info.is_dir():
                continue

            entry_path = info.filename.replace("\\", "/")
            base_entry_name = os.path.basename(entry_path)

            # Omitir archivos ocultos del sistema o metadata de Mac
            if "__MACOSX" in entry_path or base_entry_name.startswith("."):
                continue

            entry_ext = os.path.splitext(base_entry_name)[1].lower()
            if entry_ext not in ALLOWED_EXTENSIONS:
                warnings.append(
                    f"El archivo '{entry_path}' no corresponde a un archivo permitido en el sistema (por ejemplo, imagenes o presentaciones PowerPoint). Se omitio."
                )
                continue

            try:
                entry_bytes = zf.read(info)
            except Exception as e:
                warnings.append(f"Error al leer '{entry_path}' desde el ZIP: {str(e)}")
                continue

            if not entry_bytes:
                warnings.append(f"El archivo '{entry_path}' dentro del ZIP esta vacio y fue omitido.")
                continue

            try:
                md_content = convert_to_markdown(entry_bytes, entry_ext, entry_path)
            except Exception as err:
                logger.error(f"[NEXONOTES-ZIP] Error convirtiendo '{entry_path}': {err}")
                warnings.append(f"Fallo al convertir '{entry_path}' a Markdown: {str(err)}")
                continue

            if not md_content.strip():
                warnings.append(f"No se pudo extraer texto del archivo '{entry_path}'.")
                continue

            # Calcular carpeta destino respetando estructura relativa del ZIP
            rel_dir = os.path.dirname(entry_path).strip("/\\")
            if clean_base_folder:
                dest_folder = f"{clean_base_folder}/{rel_dir}".strip("/") if rel_dir else clean_base_folder
            elif rel_dir:
                dest_folder = rel_dir
            else:
                dest_folder = None

            raw_title = os.path.splitext(base_entry_name)[0]
            clean_title = raw_title.replace("_", " ").strip() or "Nota Importada"

            new_note = Note(
                title=clean_title[:100],
                content=md_content.strip(),
                tags=parsed_tags,
                folder=dest_folder[:60] if dest_folder else None
            )
            db.add(new_note)
            db.commit()
            db.refresh(new_note)

            _, emb_err = sync_note_embedding(db, new_note)
            db.refresh(new_note)
            imported_notes.append(to_note_response(new_note, embedding_error=emb_err))

        if not imported_notes and warnings:
            return NoteImportResult(
                success=False,
                imported_count=0,
                notes=[],
                note=None,
                warnings=warnings
            )

        return NoteImportResult(
            success=len(imported_notes) > 0,
            imported_count=len(imported_notes),
            notes=imported_notes,
            note=imported_notes[0] if imported_notes else None,
            warnings=warnings
        )

    # Caso B: Archivo individual (.md, .txt, .docx, .pdf)
    name_root, _ = os.path.splitext(original_filename)
    note_title = title.strip() if title and title.strip() else name_root.strip() or "Documento Importado"

    try:
        md_content = convert_to_markdown(content_bytes, ext_lower, original_filename)
    except Exception as err:
        logger.error(f"[NEXONOTES-IMPORT] Error convirtiendo '{original_filename}': {err}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Fallo al convertir '{original_filename}' a Markdown: {str(err)}"
        )

    if not md_content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se pudo extraer texto de '{original_filename}' para generar la nota en Markdown."
        )

    new_note = Note(
        title=note_title[:100],
        content=md_content.strip(),
        tags=parsed_tags,
        folder=clean_base_folder
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    _, emb_err = sync_note_embedding(db, new_note)
    db.refresh(new_note)
    note_resp = to_note_response(new_note, embedding_error=emb_err)

    return NoteImportResult(
        success=True,
        imported_count=1,
        notes=[note_resp],
        note=note_resp,
        warnings=[]
    )


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

    if "folder" in payload.model_fields_set:
        clean_folder = payload.folder.strip() if (payload.folder and payload.folder.strip()) else None
        if clean_folder != note.folder:
            note.folder = clean_folder
            changed = True

    emb_err = None
    if changed:
        db.add(note)
        db.commit()
        db.refresh(note)

        # Si cambio contenido, titulo o tags, regenerar vector de inmediato
        if re_embed:
            _, emb_err = sync_note_embedding(db, note)
            db.refresh(note)

    return to_note_response(note, embedding_error=emb_err)


@router.put("/folder/rename", status_code=status.HTTP_200_OK)
def rename_folder(payload: FolderRenamePayload, db: Session = Depends(get_db)):
    clean_old = payload.old_folder.strip()
    clean_new = payload.new_folder.strip()
    if not clean_old or not clean_new:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se deben proporcionar tanto el nombre antiguo como el nuevo nombre de la carpeta."
        )

    if clean_old == clean_new:
        return {"status": "ok", "old_folder": clean_old, "new_folder": clean_new, "renamed_notes": 0}

    stmt = select(Note).where(or_(Note.folder == clean_old, Note.folder.like(f"{clean_old}/%")))
    notes = db.execute(stmt).scalars().all()

    renamed_count = 0
    for note in notes:
        if note.folder == clean_old:
            note.folder = clean_new
            renamed_count += 1
        elif note.folder and note.folder.startswith(f"{clean_old}/"):
            sub_path = note.folder[len(clean_old) + 1:]
            note.folder = f"{clean_new}/{sub_path}"
            renamed_count += 1
        db.add(note)

    db.commit()
    return {"status": "ok", "old_folder": clean_old, "new_folder": clean_new, "renamed_notes": renamed_count}


@router.delete("/folder", status_code=status.HTTP_200_OK)
def delete_folder(
    folder: str = Query(..., description="Ruta de la carpeta a eliminar junto a todo su contenido"),
    db: Session = Depends(get_db)
):
    clean_folder = folder.strip()
    if not clean_folder:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere especificar la ruta de la carpeta a eliminar."
        )

    stmt = select(Note).where(or_(Note.folder == clean_folder, Note.folder.like(f"{clean_folder}/%")))
    notes = db.execute(stmt).scalars().all()

    count = len(notes)
    for note in notes:
        db.delete(note)
    db.commit()

    return {"status": "ok", "deleted_folder": clean_folder, "notes_deleted": count}


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
