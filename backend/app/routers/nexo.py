from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import NexoQueryRequest, NexoQueryResponse
from app.services.rag import execute_nexo_rag

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
