from datetime import datetime, timedelta

from app.models.patient import Patient

from .test_auth import get_admin_headers


def _create_patient(db_session) -> Patient:
    patient = Patient(
        full_name="Appointment Patient",
        email="appt@test.com",
        phone="555-0101",
    )
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)
    return patient


def test_admin_creates_appointment(client, db_session):
    patient = _create_patient(db_session)
    headers = get_admin_headers(client)
    response = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. Adams",
            "department": "Cardiology",
            "appointment_datetime": (datetime.utcnow() + timedelta(days=2)).isoformat(),
            "notes": "Follow-up",
            "status": "Scheduled",
        },
    )
    assert response.status_code == 201
    assert response.json()["doctor_name"] == "Dr. Adams"


def test_admin_lists_appointments_with_patient_details(client, db_session):
    patient = _create_patient(db_session)
    headers = get_admin_headers(client)
    client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. Smith",
            "appointment_datetime": (datetime.utcnow() + timedelta(days=1)).isoformat(),
            "status": "Scheduled",
        },
    )
    response = client.get("/api/v1/appointments/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["patient"]["full_name"] == patient.full_name
