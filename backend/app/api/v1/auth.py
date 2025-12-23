from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, get_current_admin, get_password_hash, verify_password
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserLogin, UserResponse, UserSignup
from app.db.session import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clinic staff can access MediTrack",
        )
    token = create_access_token(
        {"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer", "user": UserResponse.from_orm(user)}


@router.post("/signup", response_model=dict, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignup, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )
    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=f"{payload.first_name} {payload.last_name}".strip(),
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        specialty=payload.specialty,
        license_number=payload.license_number,
        license_state=payload.license_state,
        license_country=payload.license_country,
        npi_number=payload.npi_number,
        taxonomy_code=payload.taxonomy_code,
        clinic_name=payload.clinic_name,
        clinic_address=payload.clinic_address,
        clinic_city=payload.clinic_city,
        clinic_state=payload.clinic_state,
        clinic_zip=payload.clinic_zip,
        clinic_country=payload.clinic_country,
        role=UserRole.admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(
        {"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer", "user": UserResponse.from_orm(user)}


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )
    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        role=UserRole.admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
