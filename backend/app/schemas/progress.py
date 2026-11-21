from typing import List, Optional
from pydantic import BaseModel


class SubjectProgress(BaseModel):
    subject_id: str
    subject_title: str
    course_title: str
    total_assignments: int
    submitted_assignments: int
    evaluated_assignments: int
    average_assignment_score: float
    total_quizzes: int
    attempted_quizzes: int
    average_quiz_score: float
    attendance_rate: float


class StudentProgressSummary(BaseModel):
    student_id: str
    student_name: str
    student_identifier: Optional[str] = None
    institution_id: Optional[str] = None
    enrolled_courses_count: int
    overall_attendance_rate: float
    assignment_completion_rate: float
    quiz_average_score: float
    overall_academic_score: float
    subjects_progress: List[SubjectProgress] = []


class InstitutionDashboardStats(BaseModel):
    institution_id: str
    institution_name: str
    total_students: int
    total_teachers: int
    total_parents: int
    total_courses: int
    total_classes: int
    total_subjects: int
    active_assignments: int
    published_quizzes: int
    average_attendance_rate: float
