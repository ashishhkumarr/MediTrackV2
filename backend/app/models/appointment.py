from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class AppointmentStatus(str, PyEnum):
    scheduled = "Scheduled"
    completed = "Completed"
    cancelled = "Cancelled"


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_name = Column(String, nullable=False)
    department = Column(String, nullable=True)
    appointment_datetime = Column(DateTime, nullable=False)
    appointment_end_datetime = Column(DateTime, nullable=True)
    reminder_sent_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(
        Enum(AppointmentStatus),
        default=AppointmentStatus.scheduled,
        nullable=False,
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    patient = relationship("Patient", back_populates="appointments")
