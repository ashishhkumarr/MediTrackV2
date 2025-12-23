from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    get_current_active_user,
    get_current_admin,
    get_password_hash,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import PasswordChange, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def read_current_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if payload.full_name:
        current_user.full_name = payload.full_name
    if payload.first_name is not None:
        current_user.first_name = payload.first_name
    if payload.last_name is not None:
        current_user.last_name = payload.last_name
    if payload.phone is not None:
        current_user.phone = payload.phone
    if payload.specialty is not None:
        current_user.specialty = payload.specialty
    if payload.license_number is not None:
        current_user.license_number = payload.license_number
    if payload.license_state is not None:
        current_user.license_state = payload.license_state
    if payload.license_country is not None:
        current_user.license_country = payload.license_country
    if payload.npi_number is not None:
        current_user.npi_number = payload.npi_number
    if payload.taxonomy_code is not None:
        current_user.taxonomy_code = payload.taxonomy_code
    if payload.clinic_name is not None:
        current_user.clinic_name = payload.clinic_name
    if payload.clinic_address is not None:
        current_user.clinic_address = payload.clinic_address
    if payload.clinic_city is not None:
        current_user.clinic_city = payload.clinic_city
    if payload.clinic_state is not None:
        current_user.clinic_state = payload.clinic_state
    if payload.clinic_zip is not None:
        current_user.clinic_zip = payload.clinic_zip
    if payload.clinic_country is not None:
        current_user.clinic_country = payload.clinic_country
    if payload.first_name is not None or payload.last_name is not None:
        full_name_parts = [
            part for part in [current_user.first_name, current_user.last_name] if part
        ]
        if full_name_parts:
            current_user.full_name = " ".join(full_name_parts)
    if payload.password:
        current_user.hashed_password = get_password_hash(payload.password)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


def _apply_password_change(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Old password is incorrect",
        )
    current_user.hashed_password = get_password_hash(payload.new_password)
    db.add(current_user)
    db.commit()
    return {"detail": "Password updated successfully"}


@router.post("/change-password", operation_id="change_password_post")
def change_password_post(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return _apply_password_change(payload, db, current_user)


@router.put("/change-password", operation_id="change_password_put")
def change_password_put(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return _apply_password_change(payload, db, current_user)


@router.get("/", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return db.query(User).all()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
