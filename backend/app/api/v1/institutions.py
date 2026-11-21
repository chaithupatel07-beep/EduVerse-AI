from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User, UserRole
from app.schemas.common import ApiResponse
from app.schemas.institution import (
    InstitutionCreate,
    InstitutionInvitationRequest,
    InstitutionResponse,
)
from app.services.institution_service import institution_service

router = APIRouter(prefix="/institutions", tags=["Institutions"])


@router.get("", response_model=ApiResponse[List[InstitutionResponse]])
async def list_institutions(db: AsyncSession = Depends(get_db)):
    """List all registered institutions."""
    institutions = await institution_service.get_all_institutions(db)
    items = [InstitutionResponse.model_validate(inst) for inst in institutions]
    return ApiResponse(
        success=True,
        message=f"Retrieved {len(items)} institutions.",
        data=items,
    )


@router.get("/{institution_id}", response_model=ApiResponse[InstitutionResponse])
async def get_institution(institution_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve institution details by ID."""
    inst = await institution_service.get_institution_by_id(institution_id, db)
    if not inst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Institution '{institution_id}' not found.",
        )
    return ApiResponse(
        success=True,
        message="Institution retrieved successfully.",
        data=InstitutionResponse.model_validate(inst),
    )


@router.post("", response_model=ApiResponse[InstitutionResponse], status_code=status.HTTP_201_CREATED)
async def create_institution(
    data: InstitutionCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new institution (Administrator privileges required)."""
    inst = await institution_service.create_institution(data, current_user, db)
    return ApiResponse(
        success=True,
        message="Institution created successfully.",
        data=InstitutionResponse.model_validate(inst),
    )


@router.post("/{institution_id}/invitations", response_model=ApiResponse[dict])
async def create_invitation(
    institution_id: str,
    data: InstitutionInvitationRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate an institution invitation for teachers, students, or staff.
    Restricted to authorized Institution Administrators.
    """
    if current_user.institution_id and current_user.institution_id != institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are only authorized to invite members to your own institution.",
        )

    inst = await institution_service.get_institution_by_id(institution_id, db)
    if not inst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found.",
        )

    invite_code = f"INV-{inst.code}-{data.role.upper()[:3]}-2026"
    return ApiResponse(
        success=True,
        message=f"Invitation generated for {data.email}.",
        data={
            "recipient_email": data.email,
            "role": data.role,
            "institution_code": inst.code,
            "invitation_code": invite_code,
            "instructions": f"Use invitation code '{invite_code}' during registration to join {inst.name}.",
        },
    )
