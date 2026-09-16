from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import NexoQueryRequest, NexoQueryResponse
from app.services.rag import execute_nexo_rag, stream_nexo_rag

router = APIRouter(prefix="/api/nexo", tags=["Nexo"])


@router.post("/query", response_model=NexoQueryResponse)
def ask_nexo_endpoint(payload: NexoQueryRequest, db: Session = Depends(get_db)):
    if not payload.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La consulta enviada no puede estar vacia."
        )

    try:
        response = execute_nexo_rag(
            db=db,
            query=payload.query.strip(),
            top_k=payload.top_k or 4
        )
        return response
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fallo critico al consultar Nexo: {str(exc)}"
        )


@router.get("/stream")
def stream_nexo_endpoint(
    query: str = Query(..., min_length=1),
    top_k: int = Query(4, ge=1, le=20),
    db: Session = Depends(get_db)
):
    clean_query = query.strip()
    if not clean_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La consulta enviada no puede estar vacia."
        )

    return StreamingResponse(
        stream_nexo_rag(db=db, query=clean_query, top_k=top_k),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
