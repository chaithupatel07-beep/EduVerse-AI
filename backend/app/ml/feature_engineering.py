"""
EduVerse AI - Machine Learning Feature Engineering (Phase 5)
Extracts, normalizes, and transforms student academic metrics into tabular features for ML models.
"""
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd


FEATURE_NAMES = [
    "attendance_rate",
    "quiz_average",
    "quiz_completion_rate",
    "assignment_average",
    "assignment_completion_rate",
    "topic_mastery_ratio",
    "learning_streak_days",
]


def extract_student_features(
    attendance_rate: float,
    quiz_average: float,
    quizzes_completed: int,
    total_assigned_quizzes: int,
    assignment_average: float,
    assignments_completed: int,
    total_assigned_assignments: int,
    topic_mastery_ratio: float,
    learning_streak_days: int = 1,
) -> Dict[str, float]:
    """
    Transforms raw counts and averages into normalized tabular features.
    Handles zero division gracefully.
    """
    quiz_completion_rate = (
        round(quizzes_completed / total_assigned_quizzes * 100.0, 1)
        if total_assigned_quizzes > 0
        else (100.0 if quizzes_completed > 0 else 0.0)
    )
    assignment_completion_rate = (
        round(assignments_completed / total_assigned_assignments * 100.0, 1)
        if total_assigned_assignments > 0
        else (100.0 if assignments_completed > 0 else 0.0)
    )

    return {
        "attendance_rate": float(np.clip(attendance_rate, 0.0, 100.0)),
        "quiz_average": float(np.clip(quiz_average, 0.0, 100.0)),
        "quiz_completion_rate": float(np.clip(quiz_completion_rate, 0.0, 100.0)),
        "assignment_average": float(np.clip(assignment_average, 0.0, 100.0)),
        "assignment_completion_rate": float(np.clip(assignment_completion_rate, 0.0, 100.0)),
        "topic_mastery_ratio": float(np.clip(topic_mastery_ratio, 0.0, 1.0)),
        "learning_streak_days": float(max(1, learning_streak_days)),
    }


def features_to_dataframe(feature_dicts: List[Dict[str, float]]) -> pd.DataFrame:
    """
    Converts list of feature dictionaries into a pandas DataFrame matching FEATURE_NAMES.
    """
    df = pd.DataFrame(feature_dicts)
    for col in FEATURE_NAMES:
        if col not in df.columns:
            df[col] = 0.0
    return df[FEATURE_NAMES]
