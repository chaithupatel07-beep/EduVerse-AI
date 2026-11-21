from app.models.base import Base, TimestampMixin, generate_uuid
from app.models.institution import Institution
from app.models.user import User, UserRole, ParentStudentLink
from app.models.profiles import (
    StudentProfile,
    TeacherProfile,
    ParentProfile,
    InstitutionMembership,
    ParentStudentRelationship,
)
from app.models.academic import (
    Department,
    Course,
    Subject,
    ClassRoom,
    ClassEnrollment,
    TeacherAssignment,
)
from app.models.material import StudyMaterial
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.quiz import Quiz, QuizQuestion, QuizOption, QuizAttempt, QuizAnswer
from app.models.attendance import AttendanceSession, AttendanceRecord, AttendanceAuditLog
from app.models.communication import (
    Announcement,
    Notification,
    CommunicationRequest,
    CommunicationThread,
    CommunicationMessage,
)
from app.models.ai import (
    AIConversation,
    AIMessage,
    DocumentChunk,
    UserLanguagePreference,
)

__all__ = [
    "Base",
    "TimestampMixin",
    "generate_uuid",
    "Institution",
    "User",
    "UserRole",
    "ParentStudentLink",
    "StudentProfile",
    "TeacherProfile",
    "ParentProfile",
    "InstitutionMembership",
    "ParentStudentRelationship",
    "Department",
    "Course",
    "Subject",
    "ClassRoom",
    "ClassEnrollment",
    "TeacherAssignment",
    "StudyMaterial",
    "Assignment",
    "AssignmentSubmission",
    "Quiz",
    "QuizQuestion",
    "QuizOption",
    "QuizAttempt",
    "QuizAnswer",
    "AttendanceSession",
    "AttendanceRecord",
    "AttendanceAuditLog",
    "Announcement",
    "Notification",
    "CommunicationRequest",
    "CommunicationThread",
    "CommunicationMessage",
    "AIConversation",
    "AIMessage",
    "DocumentChunk",
    "UserLanguagePreference",
]
