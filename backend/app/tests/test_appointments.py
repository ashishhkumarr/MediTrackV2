from datetime import datetime, timedelta

from app.api.v1 import appointments as appointments_api
from app.models.patient import Patient

from .test_auth import get_admin_headers

BASE_TIME = datetime(2030, 1, 1, 9, 0, 0)


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


def test_admin_can_cancel_appointment(client, db_session):
    patient = _create_patient(db_session)
    headers = get_admin_headers(client)
    create_response = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. Lee",
            "appointment_datetime": (datetime.utcnow() + timedelta(days=3)).isoformat(),
            "status": "Scheduled",
        },
    )
    appointment_id = create_response.json()["id"]

    cancel_response = client.patch(
        f"/api/v1/appointments/{appointment_id}/cancel", headers=headers
    )
    assert cancel_response.status_code == 200
    assert cancel_response.json()["status"] == "Cancelled"


def test_admin_can_mark_appointment_completed(client, db_session):
    patient = _create_patient(db_session)
    headers = get_admin_headers(client)
    create_response = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. Stone",
            "appointment_datetime": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            "status": "Scheduled",
        },
    )
    appointment_id = create_response.json()["id"]

    complete_response = client.patch(
        f"/api/v1/appointments/{appointment_id}/complete", headers=headers
    )
    assert complete_response.status_code == 200
    assert complete_response.json()["status"] == "Completed"


def test_end_time_must_be_after_start_time(client, db_session):
    patient = _create_patient(db_session)
    headers = get_admin_headers(client)
    response = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. Time",
            "appointment_datetime": (BASE_TIME + timedelta(hours=1)).isoformat(),
            "appointment_end_datetime": BASE_TIME.isoformat(),
            "status": "Scheduled",
        },
    )
    assert response.status_code == 422


def test_overlap_on_create_fails(client, db_session):
    patient = _create_patient(db_session)
    headers = get_admin_headers(client)
    first_response = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. Overlap",
            "appointment_datetime": BASE_TIME.isoformat(),
            "appointment_end_datetime": (BASE_TIME + timedelta(minutes=30)).isoformat(),
            "status": "Scheduled",
        },
    )
    assert first_response.status_code == 201

    second_response = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. Overlap",
            "appointment_datetime": (BASE_TIME + timedelta(minutes=15)).isoformat(),
            "appointment_end_datetime": (BASE_TIME + timedelta(minutes=45)).isoformat(),
            "status": "Scheduled",
        },
    )
    assert second_response.status_code == 400
    assert (
        second_response.json()["detail"]
        == "Appointment time overlaps with an existing appointment."
    )


def test_overlap_on_update_fails(client, db_session):
    patient = _create_patient(db_session)
    headers = get_admin_headers(client)
    first_response = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. Alpha",
            "appointment_datetime": BASE_TIME.isoformat(),
            "appointment_end_datetime": (BASE_TIME + timedelta(minutes=30)).isoformat(),
            "status": "Scheduled",
        },
    )
    assert first_response.status_code == 201
    second_response = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. Beta",
            "appointment_datetime": (BASE_TIME + timedelta(hours=1)).isoformat(),
            "appointment_end_datetime": (BASE_TIME + timedelta(hours=1, minutes=30)).isoformat(),
            "status": "Scheduled",
        },
    )
    assert second_response.status_code == 201
    appointment_id = second_response.json()["id"]

    update_response = client.patch(
        f"/api/v1/appointments/{appointment_id}",
        headers=headers,
        json={
            "appointment_datetime": (BASE_TIME + timedelta(minutes=10)).isoformat(),
            "appointment_end_datetime": (BASE_TIME + timedelta(minutes=40)).isoformat(),
        },
    )
    assert update_response.status_code == 400
    assert (
        update_response.json()["detail"]
        == "Appointment time overlaps with an existing appointment."
    )


def test_touching_edges_passes(client, db_session):
    patient = _create_patient(db_session)
    headers = get_admin_headers(client)
    first_response = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. Edge",
            "appointment_datetime": BASE_TIME.isoformat(),
            "appointment_end_datetime": (BASE_TIME + timedelta(minutes=30)).isoformat(),
            "status": "Scheduled",
        },
    )
    assert first_response.status_code == 201

    second_response = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. Edge",
            "appointment_datetime": (BASE_TIME + timedelta(minutes=30)).isoformat(),
            "appointment_end_datetime": (BASE_TIME + timedelta(minutes=60)).isoformat(),
            "status": "Scheduled",
        },
    )
    assert second_response.status_code == 201


def test_cancelled_and_completed_do_not_block(client, db_session):
    patient = _create_patient(db_session)
    headers = get_admin_headers(client)
    cancel_target = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. Cancel",
            "appointment_datetime": (BASE_TIME + timedelta(hours=2)).isoformat(),
            "appointment_end_datetime": (BASE_TIME + timedelta(hours=2, minutes=30)).isoformat(),
            "status": "Scheduled",
        },
    )
    assert cancel_target.status_code == 201
    cancel_id = cancel_target.json()["id"]
    client.patch(f"/api/v1/appointments/{cancel_id}/cancel", headers=headers)

    cancelled_overlap = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. New",
            "appointment_datetime": (BASE_TIME + timedelta(hours=2, minutes=10)).isoformat(),
            "appointment_end_datetime": (BASE_TIME + timedelta(hours=2, minutes=40)).isoformat(),
            "status": "Scheduled",
        },
    )
    assert cancelled_overlap.status_code == 201

    complete_target = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. Complete",
            "appointment_datetime": (BASE_TIME + timedelta(hours=4)).isoformat(),
            "appointment_end_datetime": (BASE_TIME + timedelta(hours=4, minutes=30)).isoformat(),
            "status": "Scheduled",
        },
    )
    assert complete_target.status_code == 201
    complete_id = complete_target.json()["id"]
    client.patch(f"/api/v1/appointments/{complete_id}/complete", headers=headers)

    completed_overlap = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. New",
            "appointment_datetime": (BASE_TIME + timedelta(hours=4, minutes=10)).isoformat(),
            "appointment_end_datetime": (BASE_TIME + timedelta(hours=4, minutes=40)).isoformat(),
            "status": "Scheduled",
        },
    )
    assert completed_overlap.status_code == 201


def test_null_end_time_uses_default_duration(client, db_session):
    patient = _create_patient(db_session)
    headers = get_admin_headers(client)
    first_response = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. Default",
            "appointment_datetime": (BASE_TIME + timedelta(hours=6)).isoformat(),
            "status": "Scheduled",
        },
    )
    assert first_response.status_code == 201

    second_response = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. Default",
            "appointment_datetime": (BASE_TIME + timedelta(hours=6, minutes=15)).isoformat(),
            "status": "Scheduled",
        },
    )
    assert second_response.status_code == 400
    assert (
        second_response.json()["detail"]
        == "Appointment time overlaps with an existing appointment."
    )


def test_email_sent_on_create_update_and_cancel(client, db_session, monkeypatch):
    patient = _create_patient(db_session)
    patient.email = "notify@example.com"
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)
    headers = get_admin_headers(client)
    sent = []

    def fake_send_email(to, subject, html_body, text_body=None):
        sent.append({"to": to, "subject": subject})

    monkeypatch.setattr(appointments_api, "send_email", fake_send_email)

    create_response = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. Email",
            "appointment_datetime": (BASE_TIME + timedelta(hours=7)).isoformat(),
            "appointment_end_datetime": (BASE_TIME + timedelta(hours=7, minutes=30)).isoformat(),
            "status": "Scheduled",
        },
    )
    assert create_response.status_code == 201
    appointment_id = create_response.json()["id"]
    assert len(sent) == 1

    update_response = client.patch(
        f"/api/v1/appointments/{appointment_id}",
        headers=headers,
        json={
            "appointment_datetime": (BASE_TIME + timedelta(hours=8)).isoformat(),
            "appointment_end_datetime": (BASE_TIME + timedelta(hours=8, minutes=30)).isoformat(),
        },
    )
    assert update_response.status_code == 200
    assert len(sent) == 2

    cancel_response = client.patch(
        f"/api/v1/appointments/{appointment_id}/cancel", headers=headers
    )
    assert cancel_response.status_code == 200
    assert len(sent) == 3


def test_no_email_sent_when_patient_missing_email(client, db_session, monkeypatch):
    patient = _create_patient(db_session)
    patient.email = None
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)
    headers = get_admin_headers(client)
    sent = []

    def fake_send_email(to, subject, html_body, text_body=None):
        sent.append({"to": to, "subject": subject})

    monkeypatch.setattr(appointments_api, "send_email", fake_send_email)

    create_response = client.post(
        "/api/v1/appointments/",
        headers=headers,
        json={
            "patient_id": patient.id,
            "doctor_name": "Dr. Email",
            "appointment_datetime": (BASE_TIME + timedelta(hours=9)).isoformat(),
            "appointment_end_datetime": (BASE_TIME + timedelta(hours=9, minutes=30)).isoformat(),
            "status": "Scheduled",
        },
    )
    assert create_response.status_code == 201
    assert len(sent) == 0
