from datetime import date

from app.models.patient import Patient

from .test_auth import get_admin_headers


def test_admin_can_create_patient(client):
    headers = get_admin_headers(client)
    response = client.post(
        "/api/v1/patients/",
        headers=headers,
        json={
            "full_name": "Jane Doe",
            "email": "jane@example.com",
            "phone": "555-1234",
            "medical_history": "Asthma",
        },
    )
    assert response.status_code == 201
    assert response.json()["full_name"] == "Jane Doe"


def test_admin_can_view_patient_details(client, db_session):
    patient = Patient(
        full_name="View Only",
        date_of_birth=date(1988, 5, 5),
        email="view@example.com",
        phone="555-8888",
    )
    db_session.add(patient)
    db_session.commit()
    db_session.refresh(patient)

    headers = get_admin_headers(client)
    response = client.get(f"/api/v1/patients/{patient.id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["full_name"] == "View Only"


def test_patient_routes_require_authentication(client):
    response = client.get("/api/v1/patients/")
    assert response.status_code == 401
