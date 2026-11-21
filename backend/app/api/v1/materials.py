"""
EduVerse AI - Study Materials API Router
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Form, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_teacher_or_admin
from app.models.user import User, UserRole
from app.schemas.material import StudyMaterialResponse
from app.services.material_service import material_service
from app.services.storage_service import storage_service

router = APIRouter(prefix="/materials", tags=["Study Materials"])


@router.post("", response_model=StudyMaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_study_material(
    file: UploadFile = File(...),
    title: str = Form(..., min_length=2, max_length=255),
    course_id: str = Form(...),
    subject_id: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    current_user: User = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db),
):
    material = await material_service.upload_material(
        db=db,
        file=file,
        title=title,
        course_id=course_id,
        uploader=current_user,
        subject_id=subject_id,
        description=description,
    )
    # Reload with course info
    return await material_service.get_material_by_id(db, material.id)


@router.get("", response_model=List[StudyMaterialResponse])
async def list_study_materials(
    course_id: Optional[str] = None,
    subject_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await material_service.list_materials(
        db=db,
        institution_id=current_user.institution_id,
        course_id=course_id,
        subject_id=subject_id,
        search=search,
    )


@router.get("/{material_id}", response_model=StudyMaterialResponse)
async def get_study_material(
    material_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    mat = await material_service.get_material_by_id(db, material_id)
    if current_user.institution_id and mat.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied to material outside your institution.")
    return mat


@router.get("/{material_id}/download")
async def download_study_material(
    material_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    mat = await material_service.get_material_by_id(db, material_id)
    if current_user.institution_id and mat.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied to material outside your institution.")

    abs_path = storage_service.get_absolute_path(mat.file_path)
    await material_service.record_download(db, material_id)

    return FileResponse(
        path=str(abs_path),
        media_type=mat.mime_type,
        filename=mat.original_file_name,
        headers={"Content-Disposition": f'attachment; filename="{mat.original_file_name}"'},
    )


@router.delete("/{material_id}")
async def delete_study_material(
    material_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    success = await material_service.delete_material(db, material_id, current_user)
    return {"status": "success", "message": "Study material deleted successfully."}
