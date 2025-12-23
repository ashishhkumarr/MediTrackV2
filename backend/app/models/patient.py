from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    full_name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    sex = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(Text, default="", nullable=True)
    medical_history = Column(Text, default="", nullable=True)
    medications = Column(Text, default="", nullable=True)
    notes = Column(Text, default="", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    appointments = relationship(
        "Appointment", back_populates="patient", cascade="all,delete"
    )
