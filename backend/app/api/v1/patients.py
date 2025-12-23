from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_admin
from app.db.session import get_db
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import (
    PatientCreate,
    PatientResponse,
    PatientUpdate,
)

router = APIRouter(prefix="/patients", tags=["patients"])


def _get_patient(db: Session, patient_id: int) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )
    return patient


def _build_full_name(
    full_name: str | None, first_name: str | None, last_name: str | None
) -> str | None:
    if full_name and full_name.strip():
        return full_name.strip()
    name_parts = [part.strip() for part in [first_name, last_name] if part and part.strip()]
    return " ".join(name_parts) if name_parts else None


@router.get("/", response_model=list[PatientResponse])
def list_patients(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return db.query(Patient).all()


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    patient = _get_patient(db, patient_id)
    return patient


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    payload_data = payload.dict(exclude_unset=True)
    full_name = _build_full_name(
        payload_data.get("full_name"),
        payload_data.get("first_name"),
        payload_data.get("last_name"),
    )
    if not full_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Patient first and last name are required.",
        )
    payload_data["full_name"] = full_name
    patient = Patient(**payload_data)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    patient = _get_patient(db, patient_id)
    payload_data = payload.dict(exclude_unset=True)
    if {"full_name", "first_name", "last_name"} & payload_data.keys():
        full_name = _build_full_name(
            payload_data.get("full_name"),
            payload_data.get("first_name", patient.first_name),
            payload_data.get("last_name", patient.last_name),
        )
        if full_name:
            payload_data["full_name"] = full_name
    for field, value in payload_data.items():
        setattr(patient, field, value)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    patient = _get_patient(db, patient_id)
    db.delete(patient)
    db.commit()
