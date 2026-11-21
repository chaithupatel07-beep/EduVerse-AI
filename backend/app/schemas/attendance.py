from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class AttendanceRecordEntry(BaseModel):
    student_id: str
    status: str = Field(..., pattern="^(present|absent|late|excused)$")
    remarks: Optional[str] = None


class AttendanceSessionCreate(BaseModel):
    class_id: str
    subject_id: Optional[str] = None
    session_date: date
    session_title: str = Field("Regular Lecture", min_length=2, max_length=200)
    session_notes: Optional[str] = None
    records: List[AttendanceRecordEntry] = []


class AttendanceRecordUpdate(BaseModel):
    status: str = Field(..., pattern="^(present|absent|late|excused)$")
    reason: Optional[str] = Field(None, max_length=255)


class AttendanceRecordResponse(BaseModel):
    id: str
    student_id: str
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    student_identifier: Optional[str] = None
    status: str
    remarks: Optional[str] = None
    recorded_at: datetime

    class Config:
        from_attributes = True


class AttendanceSessionResponse(BaseModel):
    id: str
    institution_id: str
    class_id: str
    class_name: Optional[str] = None
    subject_id: Optional[str] = None
    subject_title: Optional[str] = None
    teacher_id: str
    teacher_name: Optional[str] = None
    session_date: date
    session_title: str
    session_notes: Optional[str] = None
    total_records: int = 0
    present_count: int = 0
    absent_count: int = 0
    records: List[AttendanceRecordResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class StudentAttendanceSummary(BaseModel):
    student_id: str
    student_name: str
    total_sessions: int
    present_count: int
    absent_count: int
    late_count: int
    excused_count: int
    attendance_percentage: float
    records: List[AttendanceRecordResponse] = []
