from datetime import date, datetime

from pydantic import BaseModel, EmailStr


class PatientBase(BaseModel):
    full_name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    date_of_birth: date | None = None
    sex: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    medical_history: str | None = None
    medications: str | None = None
    notes: str | None = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    full_name: str | None = None
    date_of_birth: date | None = None
    sex: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    medical_history: str | None = None
    medications: str | None = None
    notes: str | None = None


class PatientNotesUpdate(BaseModel):
    notes: str | None = None


class PatientResponse(PatientBase):
    id: int
    full_name: str
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
