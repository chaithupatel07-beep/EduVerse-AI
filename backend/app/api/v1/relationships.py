from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_parent, require_student
from app.models.user import User, UserRole
from app.models.profiles import ParentStudentRelationship
from app.schemas.common import ApiResponse
from app.schemas.user import UserResponse
from app.schemas.profiles import (
    ParentStudentRelationshipRequest,
    ParentStudentRelationshipVerify,
    ParentStudentRelationshipResponse,
)
from app.services.relationship_service import relationship_service
from app.services.auth_service import auth_service

router = APIRouter(prefix="/relationships", tags=["Parent-Student Relationships"])


@router.post("/parent-student/request", response_model=ApiResponse[ParentStudentRelationshipResponse], status_code=status.HTTP_201_CREATED)
async def request_parent_student_link(
    req: ParentStudentRelationshipRequest,
    current_user: User = Depends(require_parent),
    db: AsyncSession = Depends(get_db),
):
    """
    Parent initiates a relationship linking request for a student by email.
    Status will be 'pending' until verified by the student or an institution admin.
    """
    rel = await relationship_service.request_parent_student_relationship(
        parent_user=current_user,
        student_email=req.student_email,
        relationship_type=req.relationship_type,
        notes=req.notes,
        db=db,
    )

    # Load student and parent for response payload
    student_query = await db.execute(select(User).where(User.id == rel.student_user_id))
    student = student_query.scalar_one_or_none()

    resp = ParentStudentRelationshipResponse(
        id=rel.id,
        parent_user_id=current_user.id,
        parent_name=current_user.full_name,
        parent_email=current_user.email,
        student_user_id=rel.student_user_id,
        student_name=student.full_name if student else None,
        student_email=student.email if student else None,
        relationship_type=rel.relationship_type,
        verification_status=rel.verification_status,
        verified_at=rel.verified_at,
        created_at=rel.created_at,
    )

    return ApiResponse(
        success=True,
        message="Parent-student linking request submitted. Pending verification.",
        data=resp,
    )


@router.post("/parent-student/verify", response_model=ApiResponse[ParentStudentRelationshipResponse])
async def verify_parent_student_link(
    req: ParentStudentRelationshipVerify,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Verify or reject a parent-student relationship.
    Authorized for:
    - The target student themselves.
    - An Institution Administrator.
    """
    rel = await relationship_service.verify_relationship(
        relationship_id=req.relationship_id,
        verifier_user=current_user,
        decision=req.decision,
        db=db,
    )

    parent_query = await db.execute(select(User).where(User.id == rel.parent_user_id))
    parent = parent_query.scalar_one_or_none()
    student_query = await db.execute(select(User).where(User.id == rel.student_user_id))
    student = student_query.scalar_one_or_none()

    resp = ParentStudentRelationshipResponse(
        id=rel.id,
        parent_user_id=rel.parent_user_id,
        parent_name=parent.full_name if parent else None,
        parent_email=parent.email if parent else None,
        student_user_id=rel.student_user_id,
        student_name=student.full_name if student else None,
        student_email=student.email if student else None,
        relationship_type=rel.relationship_type,
        verification_status=rel.verification_status,
        verified_at=rel.verified_at,
        created_at=rel.created_at,
    )

    return ApiResponse(
        success=True,
        message=f"Parent-student relationship {rel.verification_status}.",
        data=resp,
    )


@router.get("/parent-student", response_model=ApiResponse[List[ParentStudentRelationshipResponse]])
async def list_relationships(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List parent-student relationships relevant to the current user."""
    query = (
        select(ParentStudentRelationship)
        .options(
            selectinload(ParentStudentRelationship.parent),
            selectinload(ParentStudentRelationship.student),
        )
    )

    if current_user.role == UserRole.PARENT:
        query = query.where(ParentStudentRelationship.parent_user_id == current_user.id)
    elif current_user.role == UserRole.STUDENT:
        query = query.where(ParentStudentRelationship.student_user_id == current_user.id)
    # Admin sees all within their institution or system

    result = await db.execute(query)
    rels = result.scalars().all()

    items = [
        ParentStudentRelationshipResponse(
            id=r.id,
            parent_user_id=r.parent_user_id,
            parent_name=r.parent.full_name if r.parent else None,
            parent_email=r.parent.email if r.parent else None,
            student_user_id=r.student_user_id,
            student_name=r.student.full_name if r.student else None,
            student_email=r.student.email if r.student else None,
            relationship_type=r.relationship_type,
            verification_status=r.verification_status,
            verified_at=r.verified_at,
            created_at=r.created_at,
        )
        for r in rels
    ]

    return ApiResponse(
        success=True,
        message=f"Retrieved {len(items)} parent-student relationship records.",
        data=items,
    )


@router.get("/parent-student/my-children", response_model=ApiResponse[List[UserResponse]])
async def get_my_children(
    current_user: User = Depends(require_parent),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve only verified linked student children for the authenticated parent."""
    children = await relationship_service.get_parent_children(
        parent_user_id=current_user.id,
        db=db,
        only_verified=True,
    )
    items = [await auth_service.build_user_response(db, child) for child in children]
    return ApiResponse(
        success=True,
        message=f"Retrieved {len(items)} verified linked children.",
        data=items,
    )
