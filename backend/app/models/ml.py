"""
EduVerse AI - Machine Learning & Academic Prediction Models (Phase 5)
Tracks ML model metadata, training versions, and explainable academic performance predictions.
"""
from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


class MLModelMetadata(Base):
    """
    Metadata recording trained Scikit-learn models, evaluation metrics (R2, RMSE), and pipeline versions.
    """
    __tablename__ = "ml_models_metadata"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    model_name = Column(String(100), nullable=False)  # e.g. "academic_trajectory_regressor"
    model_version = Column(String(50), nullable=False)
    algorithm_type = Column(String(100), default="RidgeRegressor", nullable=False)  # Ridge, RandomForest, GradientBoosting
    r2_score = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    sample_size = Column(Integer, default=0, nullable=False)
    features_list = Column(JSON, default=list, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    trained_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class AcademicPrediction(Base):
    """
    Academic performance prediction records with confidence score and explainable feature importances.
    """
    __tablename__ = "academic_predictions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    model_version = Column(String(50), nullable=False)

    predicted_gpa_range = Column(String(50), nullable=False)  # e.g. "3.4 - 3.7"
    predicted_success_score = Column(Float, nullable=False)  # 0.0 - 100.0
    confidence_interval = Column(String(50), default="medium", nullable=False)  # low, medium, high
    confidence_score = Column(Float, default=0.82, nullable=False)  # 0.0 - 1.0

    contributing_factors = Column(JSON, default=dict, nullable=False)  # Feature importance map: {"attendance": 0.35, "quiz_avg": 0.40}
    suggested_interventions = Column(JSON, default=list, nullable=False)  # List of string recommendations

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student = relationship("User", foreign_keys=[student_id], lazy="selectin")
