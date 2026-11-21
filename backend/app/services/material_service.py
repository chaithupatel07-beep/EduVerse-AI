"""
EduVerse AI - Study Material Service
Handles upload, retrieval, filtering, secure download, and metadata management for educational documents.
"""
from typing import List, Optional
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.material import StudyMaterial
from app.models.academic import Course, Subject
from app.models.user import User, UserRole
from app.services.storage_service import storage_service


class MaterialService:
    async def upload_material(
        self,
        db: AsyncSession,
        file: UploadFile,
        title: str,
        course_id: str,
        uploader: User,
        subject_id: Optional[str] = None,
        description: Optional[str] = None,
    ) -> StudyMaterial:
        # Verify course exists and belongs to uploader's institution
        course_res = await db.execute(select(Course).where(Course.id == course_id))
        course = course_res.scalar_one_or_none()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found.",
            )

        if uploader.role != UserRole.ADMIN and course.institution_id != uploader.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot upload materials to a course outside your institution.",
            )

        if subject_id:
            subj_res = await db.execute(
                select(Subject).where(and_(Subject.id == subject_id, Subject.course_id == course_id))
            )
            if not subj_res.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Subject does not belong to the selected course.",
                )

        unique_name, stored_path, size_bytes, mime_type = await storage_service.save_material_file(file)
        ext = unique_name.rsplit(".", 1)[-1].lower() if "." in unique_name else "file"

        material = StudyMaterial(
            institution_id=course.institution_id,
            course_id=course_id,
            subject_id=subject_id,
            uploaded_by=uploader.id,
            title=title,
            description=description,
            file_name=unique_name,
            original_file_name=file.filename or unique_name,
            file_path=stored_path,
            file_size=size_bytes,
            mime_type=mime_type,
            file_type=ext,
            is_published=True,
        )
        db.add(material)
        await db.commit()
        await db.refresh(material)
        return material

    async def list_materials(
        self,
        db: AsyncSession,
        institution_id: Optional[str] = None,
        course_id: Optional[str] = None,
        subject_id: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[dict]:
        query = (
            select(StudyMaterial, Course, Subject, User)
            .join(Course, StudyMaterial.course_id == Course.id)
            .outerjoin(Subject, StudyMaterial.subject_id == Subject.id)
            .join(User, StudyMaterial.uploaded_by == User.id)
        )

        if institution_id:
            query = query.where(StudyMaterial.institution_id == institution_id)
        if course_id:
            query = query.where(StudyMaterial.course_id == course_id)
        if subject_id:
            query = query.where(StudyMaterial.subject_id == subject_id)
        if search:
            term = f"%{search}%"
            query = query.where(
                (StudyMaterial.title.ilike(term)) | (StudyMaterial.description.ilike(term))
            )

        query = query.order_by(StudyMaterial.created_at.desc())
        result = await db.execute(query)
        rows = result.all()

        return [
            {
                "id": mat.id,
                "institution_id": mat.institution_id,
                "course_id": mat.course_id,
                "course_title": cr.title,
                "subject_id": mat.subject_id,
                "subject_title": subj.title if subj else None,
                "uploaded_by": mat.uploaded_by,
                "uploader_name": usr.full_name,
                "title": mat.title,
                "description": mat.description,
                "file_name": mat.file_name,
                "original_file_name": mat.original_file_name,
                "file_size": mat.file_size,
                "mime_type": mat.mime_type,
                "file_type": mat.file_type,
                "download_count": mat.download_count,
                "is_published": mat.is_published,
                "rag_indexed": mat.rag_indexed,
                "rag_chunks_count": mat.rag_chunks_count,
                "created_at": mat.created_at,
            }
            for mat, cr, subj, usr in rows
        ]

    async def get_material_by_id(self, db: AsyncSession, material_id: str) -> StudyMaterial:
        result = await db.execute(
            select(StudyMaterial)
            .options(selectinload(StudyMaterial.course), selectinload(StudyMaterial.uploader))
            .where(StudyMaterial.id == material_id)
        )
        mat = result.scalar_one_or_none()
        if not mat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Study material not found.",
            )
        return mat

    async def record_download(self, db: AsyncSession, material_id: str) -> StudyMaterial:
        mat = await self.get_material_by_id(db, material_id)
        mat.download_count += 1
        await db.commit()
        await db.refresh(mat)
        return mat

    async def delete_material(self, db: AsyncSession, material_id: str, user: User) -> bool:
        mat = await self.get_material_by_id(db, material_id)
        if user.role != UserRole.ADMIN and mat.uploaded_by != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this study material.",
            )

        # Remove local file if present
        try:
            abs_path = storage_service.get_absolute_path(mat.file_path)
            if abs_path.exists():
                abs_path.unlink()
        except Exception:
            pass

        await db.delete(mat)
        await db.commit()
        return True


material_service = MaterialService()
