from datetime import datetime
from enum import Enum

from pydantic import BaseModel

from app.schemas.patient import PatientResponse


class AppointmentStatus(str, Enum):
    scheduled = "Scheduled"
    completed = "Completed"
    cancelled = "Cancelled"


class AppointmentBase(BaseModel):
    patient_id: int
    doctor_name: str
    department: str | None = None
    appointment_datetime: datetime
    notes: str | None = None
    status: AppointmentStatus = AppointmentStatus.scheduled


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    doctor_name: str | None = None
    department: str | None = None
    appointment_datetime: datetime | None = None
    notes: str | None = None
    status: AppointmentStatus | None = None


class AppointmentResponse(AppointmentBase):
    id: int
    patient: PatientResponse | None = None
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
