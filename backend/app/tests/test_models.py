from datetime import datetime

from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.user import UserRole


def test_user_role_enum():
    assert UserRole.admin.value == "admin"
    assert len(UserRole.__members__) == 1


def test_patient_relationships():
    patient = Patient(full_name="John Doe")
    assert patient.full_name == "John Doe"


def test_appointment_defaults():
    appointment = Appointment(
        patient_id=1,
        doctor_name="Dr. Who",
        appointment_datetime=datetime.utcnow(),
    )
    assert appointment.patient_id == 1
