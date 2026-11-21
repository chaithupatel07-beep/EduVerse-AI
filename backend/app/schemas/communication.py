from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# Announcement Schemas
class AnnouncementBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    content: str = Field(..., min_length=5)
    target_role: str = Field("all", pattern="^(all|student|teacher|parent)$")
    priority: str = Field("normal", pattern="^(low|normal|high|urgent)$")
    is_published: bool = True
    attachment_url: Optional[str] = None


class AnnouncementCreate(AnnouncementBase):
    pass


class AnnouncementResponse(AnnouncementBase):
    id: str
    institution_id: str
    author_id: str
    author_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Notification Schemas
class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    notification_type: str
    link_url: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Communication Request Schemas
class CommunicationRequestCreate(BaseModel):
    teacher_id: str
    student_id: str
    subject: str = Field(..., min_length=2, max_length=255)
    message: str = Field(..., min_length=5)


class CommunicationRequestRespond(BaseModel):
    status: str = Field(..., pattern="^(accepted|completed|declined)$")
    response_notes: Optional[str] = None


class CommunicationRequestResponse(BaseModel):
    id: str
    parent_id: str
    parent_name: Optional[str] = None
    teacher_id: str
    teacher_name: Optional[str] = None
    student_id: str
    student_name: Optional[str] = None
    subject: str
    message: str
    status: str
    response_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
