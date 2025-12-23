import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Integer, String

from app.db.session import Base


class UserRole(str, enum.Enum):
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    specialty = Column(String, nullable=True)
    license_number = Column(String, nullable=True)
    license_state = Column(String, nullable=True)
    license_country = Column(String, nullable=True)
    npi_number = Column(String, nullable=True)
    taxonomy_code = Column(String, nullable=True)
    clinic_name = Column(String, nullable=True)
    clinic_address = Column(String, nullable=True)
    clinic_city = Column(String, nullable=True)
    clinic_state = Column(String, nullable=True)
    clinic_zip = Column(String, nullable=True)
    clinic_country = Column(String, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.admin, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
