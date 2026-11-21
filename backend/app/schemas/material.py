from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class StudyMaterialBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    course_id: str
    subject_id: Optional[str] = None


class StudyMaterialCreate(StudyMaterialBase):
    pass


class StudyMaterialUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_published: Optional[bool] = None


class StudyMaterialResponse(BaseModel):
    id: str
    institution_id: str
    course_id: str
    course_title: Optional[str] = None
    subject_id: Optional[str] = None
    subject_title: Optional[str] = None
    uploaded_by: str
    uploader_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    file_name: str
    original_file_name: str
    file_size: int
    mime_type: str
    file_type: str
    download_count: int
    is_published: bool
    rag_indexed: bool
    rag_chunks_count: int
    created_at: datetime

    class Config:
        from_attributes = True
