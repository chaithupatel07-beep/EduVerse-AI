"""
EduVerse AI - Smart Notes Scanner and OCR Doubt Solver Endpoints (Phase 6.5)
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.innovation import ScannedDocument
from app.schemas.innovation import (
    ScannedDocumentResponse,
    OCREditTextRequest,
    OCRDoubtAskRequest,
    OCRDoubtAskResponse,
    OCRQuizGenerateRequest,
)
from app.services.ocr_scanner_service import ocr_scanner_service

router = APIRouter(prefix="/ocr", tags=["Smart Notes Scanner & OCR"])


class OCRUploadRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    file_name: str = "notes_page.pdf"
    file_size: int = 102400
    mime_type: str = "application/pdf"
    document_type: str = "notes"  # notes, textbook_page, handwritten
    language: str = "en"
    raw_text: Optional[str] = None


@router.post("/upload", response_model=ScannedDocumentResponse)
async def upload_and_process_document(
    req: OCRUploadRequest,
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload and process textbook pages or handwritten notes through OCR, text cleaning, and RAG indexing.
    """
    inst_id = current_user.institution_id or "inst-default"
    doc = await ocr_scanner_service.process_document_upload(
        db=db,
        student_id=current_user.id,
        institution_id=inst_id,
        title=req.title,
        file_name=req.file_name,
        file_size=req.file_size,
        mime_type=req.mime_type,
        document_type=req.document_type,
        language=req.language,
        raw_text_override=req.raw_text
    )

    return _build_doc_response(doc)


@router.patch("/documents/{doc_id}/correct", response_model=ScannedDocumentResponse)
async def correct_extracted_text(
    doc_id: str,
    req: OCREditTextRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Allows user to review, edit, and correct OCR extraction before finalizing vector indexing.
    """
    try:
        doc = await ocr_scanner_service.update_extracted_text(
            db=db,
            doc_id=doc_id,
            student_id=current_user.id,
            edited_text=req.edited_text
        )
        return _build_doc_response(doc)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/documents/{doc_id}/ask", response_model=OCRDoubtAskResponse)
async def ask_doubt_on_scanned_notes(
    doc_id: str,
    req: OCRDoubtAskRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Grounded academic doubt solving directly against the student's scanned notes.
    """
    try:
        res = await ocr_scanner_service.ask_doubt_on_scanned_doc(
            db=db,
            doc_id=doc_id,
            student_id=current_user.id,
            question=req.question,
            language=req.language
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/documents/{doc_id}/generate-quiz")
async def generate_quiz_from_notes(
    doc_id: str,
    req: OCRQuizGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generates formative review questions derived directly from the scanned note.
    """
    try:
        res = await ocr_scanner_service.generate_quiz_from_scanned_doc(
            db=db,
            doc_id=doc_id,
            student_id=current_user.id,
            num_questions=req.num_questions,
            language=req.language
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/documents", response_model=List[ScannedDocumentResponse])
@router.get("/documents/", include_in_schema=False)
async def list_scanned_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List scanned documents uploaded by the authenticated student.
    """
    stmt = select(ScannedDocument).where(
        ScannedDocument.student_id == current_user.id
    ).order_by(ScannedDocument.created_at.desc())
    res = await db.execute(stmt)
    docs = res.scalars().all()
    return [_build_doc_response(d) for d in docs]


def _build_doc_response(doc: ScannedDocument) -> Dict[str, Any]:
    raw_txt = doc.extracted_text.raw_extracted_text if doc.extracted_text else ""
    cleaned_txt = doc.extracted_text.cleaned_text if doc.extracted_text else ""
    edited_txt = doc.extracted_text.user_edited_text if doc.extracted_text else None
    summary_txt = doc.extracted_text.summary if doc.extracted_text else None
    concepts = doc.extracted_text.extracted_key_concepts if doc.extracted_text else []

    return {
        "id": doc.id,
        "institution_id": doc.institution_id,
        "student_id": doc.student_id,
        "subject_id": doc.subject_id,
        "title": doc.title,
        "document_type": doc.document_type,
        "file_name": doc.file_name,
        "file_size": doc.file_size,
        "mime_type": doc.mime_type,
        "detected_language": doc.detected_language,
        "ocr_status": doc.ocr_status,
        "ocr_confidence": doc.ocr_confidence,
        "is_indexed_in_rag": doc.is_indexed_in_rag,
        "raw_text": raw_txt,
        "cleaned_text": cleaned_txt,
        "user_edited_text": edited_txt,
        "summary": summary_txt,
        "extracted_key_concepts": concepts,
        "created_at": doc.created_at,
    }
