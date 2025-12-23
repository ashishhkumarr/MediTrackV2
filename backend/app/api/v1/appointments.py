from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
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
DEFAULT_DOCTOR_NAME = "TBD"


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


def _normalize_doctor_name(name: str | None) -> str:
    if name and name.strip():
        return name.strip()
    return DEFAULT_DOCTOR_NAME


def _validate_time_range(start_time, end_time):
    if end_time and start_time and end_time <= start_time:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Appointment end time must be after start time.",
        )


def _resolve_end_time(start_time, end_time):
    if not start_time:
        return end_time
    return end_time or start_time + timedelta(
        minutes=settings.APPOINTMENT_DEFAULT_DURATION_MINUTES
    )


def _assert_no_overlapping_appointments(
    db: Session,
    start_time,
    end_time,
    appointment_id: int | None = None,
):
    effective_end_time = _resolve_end_time(start_time, end_time)
    if not start_time or not effective_end_time:
        return

    query = db.query(Appointment).filter(
        Appointment.status == AppointmentStatus.scheduled
    )
    if appointment_id is not None:
        query = query.filter(Appointment.id != appointment_id)

    for existing in query.all():
        existing_start = existing.appointment_datetime
        existing_end = _resolve_end_time(
            existing_start, existing.appointment_end_datetime
        )
        if existing_start and existing_end:
            if start_time < existing_end and effective_end_time > existing_start:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Appointment time overlaps with an existing appointment.",
                )


def _prepare_update_data(payload: AppointmentUpdate) -> dict:
    update_data = payload.dict(exclude_unset=True)
    if "doctor_name" in update_data:
        update_data["doctor_name"] = _normalize_doctor_name(
            update_data.get("doctor_name")
        )
    return update_data


def _apply_appointment_update(appointment: Appointment, update_data: dict) -> Appointment:
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
    payload_data = payload.dict(exclude_unset=True)
    payload_data["doctor_name"] = _normalize_doctor_name(payload_data.get("doctor_name"))
    _validate_time_range(
        payload_data.get("appointment_datetime"),
        payload_data.get("appointment_end_datetime"),
    )
    status_value = payload_data.get("status", AppointmentStatus.scheduled)
    if status_value == AppointmentStatus.scheduled:
        _assert_no_overlapping_appointments(
            db,
            payload_data.get("appointment_datetime"),
            payload_data.get("appointment_end_datetime"),
        )
    appointment = Appointment(**payload_data)
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
    update_data = _prepare_update_data(payload)
    start_time = update_data.get("appointment_datetime", appointment.appointment_datetime)
    end_time = (
        update_data["appointment_end_datetime"]
        if "appointment_end_datetime" in update_data
        else appointment.appointment_end_datetime
    )
    status_value = update_data.get("status", appointment.status)
    _validate_time_range(start_time, end_time)
    if status_value == AppointmentStatus.scheduled:
        _assert_no_overlapping_appointments(
            db, start_time, end_time, appointment_id=appointment.id
        )
    _apply_appointment_update(appointment, update_data)
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
    update_data = _prepare_update_data(payload)
    start_time = update_data.get("appointment_datetime", appointment.appointment_datetime)
    end_time = (
        update_data["appointment_end_datetime"]
        if "appointment_end_datetime" in update_data
        else appointment.appointment_end_datetime
    )
    status_value = update_data.get("status", appointment.status)
    _validate_time_range(start_time, end_time)
    if status_value == AppointmentStatus.scheduled:
        _assert_no_overlapping_appointments(
            db, start_time, end_time, appointment_id=appointment.id
        )
    _apply_appointment_update(appointment, update_data)
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
