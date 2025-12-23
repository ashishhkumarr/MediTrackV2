from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.core.security import get_current_admin
from app.db.session import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import Patient
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
)

router = APIRouter(prefix="/appointments", tags=["appointments"])


def _get_appointment(db: Session, appointment_id: int) -> Appointment:
    appointment = (
        db.query(Appointment)
        .options(selectinload(Appointment.patient))
        .filter(Appointment.id == appointment_id)
        .first()
    )
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found"
        )
    return appointment


def _apply_appointment_update(
    appointment: Appointment,
    payload: AppointmentUpdate,
) -> Appointment:
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)
    return appointment


@router.get("/", response_model=list[AppointmentResponse])
def list_appointments(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return (
        db.query(Appointment)
        .options(selectinload(Appointment.patient))
        .all()
    )


@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    patient = _ensure_patient_exists(db, payload.patient_id)
    appointment = Appointment(**payload.dict())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    appointment.patient = patient
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    payload: AppointmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    appointment = _get_appointment(db, appointment_id)
    _apply_appointment_update(appointment, payload)
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.patch("/{appointment_id}", response_model=AppointmentResponse)
def patch_appointment(
    appointment_id: int,
    payload: AppointmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    appointment = _get_appointment(db, appointment_id)
    _apply_appointment_update(appointment, payload)
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.patch("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    appointment = _get_appointment(db, appointment_id)
    if appointment.status != AppointmentStatus.cancelled:
        appointment.status = AppointmentStatus.cancelled
        db.add(appointment)
        db.commit()
        db.refresh(appointment)
    return appointment


@router.patch("/{appointment_id}/complete", response_model=AppointmentResponse)
def complete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    appointment = _get_appointment(db, appointment_id)
    if appointment.status != AppointmentStatus.completed:
        appointment.status = AppointmentStatus.completed
        db.add(appointment)
        db.commit()
        db.refresh(appointment)
    return appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    appointment = _get_appointment(db, appointment_id)
    db.delete(appointment)
    db.commit()


def _ensure_patient_exists(db: Session, patient_id: int) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )
    return patient
