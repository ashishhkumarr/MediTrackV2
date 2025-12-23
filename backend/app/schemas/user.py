from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field, model_validator


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    specialty: str | None = None
    license_number: str | None = None
    license_state: str | None = None
    license_country: str | None = None
    npi_number: str | None = None
    taxonomy_code: str | None = None
    clinic_name: str | None = None
    clinic_address: str | None = None
    clinic_city: str | None = None
    clinic_state: str | None = None
    clinic_zip: str | None = None
    clinic_country: str | None = None


class UserRole(str, Enum):
    admin = "admin"


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    phone: str | None = None
    password: str = Field(min_length=8)


class UserSignup(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str | None = None
    specialty: str | None = None
    license_number: str
    license_state: str | None = None
    license_country: str | None = None
    npi_number: str | None = None
    taxonomy_code: str | None = None
    clinic_name: str
    clinic_address: str
    clinic_city: str
    clinic_state: str
    clinic_zip: str
    clinic_country: str
    password: str = Field(min_length=8)
    confirm_password: str

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    password: str | None = Field(default=None, min_length=8)
    first_name: str | None = None
    last_name: str | None = None
    specialty: str | None = None
    license_number: str | None = None
    license_state: str | None = None
    license_country: str | None = None
    npi_number: str | None = None
    taxonomy_code: str | None = None
    clinic_name: str | None = None
    clinic_address: str | None = None
    clinic_city: str | None = None
    clinic_state: str | None = None
    clinic_zip: str | None = None
    clinic_country: str | None = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8)
    confirm_new_password: str

    @model_validator(mode="after")
    def passwords_match(self):
        if self.new_password != self.confirm_new_password:
            raise ValueError("New passwords do not match")
        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    role: UserRole = UserRole.admin
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
