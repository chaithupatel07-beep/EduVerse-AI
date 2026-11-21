from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# Option Schemas
class QuizOptionBase(BaseModel):
    option_text: str = Field(..., min_length=1)
    is_correct: bool = False
    order_index: int = 0


class QuizOptionCreate(QuizOptionBase):
    pass


class QuizOptionResponse(BaseModel):
    id: str
    question_id: str
    option_text: str
    # is_correct is intentionally excluded or conditional for student views
    is_correct: Optional[bool] = None
    order_index: int

    class Config:
        from_attributes = True


# Question Schemas
class QuizQuestionBase(BaseModel):
    question_text: str = Field(..., min_length=2)
    question_type: str = "mcq"  # 'mcq', 'multi_select', 'true_false', 'short_answer'
    points: float = Field(10.0, gt=0)
    order_index: int = 0
    explanation: Optional[str] = None


class QuizQuestionCreate(QuizQuestionBase):
    options: List[QuizOptionCreate] = []


class QuizQuestionResponse(QuizQuestionBase):
    id: str
    quiz_id: str
    options: List[QuizOptionResponse] = []

    class Config:
        from_attributes = True


# Quiz Schemas
class QuizBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    instructions: Optional[str] = None
    class_id: str
    subject_id: Optional[str] = None
    duration_minutes: int = Field(30, ge=1, le=240)
    total_marks: float = Field(100.0, gt=0)
    passing_marks: float = Field(40.0, ge=0)
    is_published: bool = True
    results_released: bool = True


class QuizCreate(QuizBase):
    questions: List[QuizQuestionCreate] = []


class QuizResponse(QuizBase):
    id: str
    institution_id: str
    teacher_id: str
    teacher_name: Optional[str] = None
    class_name: Optional[str] = None
    subject_title: Optional[str] = None
    total_questions: int = 0
    questions: List[QuizQuestionResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


# Attempt & Answer Schemas
class QuizAnswerSubmit(BaseModel):
    question_id: str
    selected_option_id: Optional[str] = None
    selected_option_ids: Optional[List[str]] = None
    text_answer: Optional[str] = None


class QuizAttemptSubmit(BaseModel):
    answers: List[QuizAnswerSubmit] = []


class QuizAnswerResult(BaseModel):
    question_id: str
    question_text: str
    question_type: str
    points: float
    selected_option_id: Optional[str] = None
    text_answer: Optional[str] = None
    is_correct: bool
    marks_awarded: float
    explanation: Optional[str] = None


class QuizAttemptResponse(BaseModel):
    id: str
    quiz_id: str
    quiz_title: Optional[str] = None
    student_id: str
    student_name: Optional[str] = None
    status: str
    score: float
    percentage: float
    passed: bool
    started_at: datetime
    submitted_at: Optional[datetime] = None
    results_released: bool = True
    answers: List[QuizAnswerResult] = []

    class Config:
        from_attributes = True
