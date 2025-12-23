from app.models.user import UserRole


def get_admin_headers(client):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "adminpass"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "adminpass"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_failure(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "wrong"},
    )
    assert response.status_code == 401


def test_admin_can_register_user(client):
    headers = get_admin_headers(client)
    response = client.post(
        "/api/v1/auth/register",
        headers=headers,
        json={
            "email": "patient@test.com",
            "password": "patientpass",
            "full_name": "Patient",
            "phone": "555-0101",
        },
    )
    assert response.status_code == 201
    assert response.json()["email"] == "patient@test.com"
    assert response.json()["role"] == UserRole.admin.value


def _signup_payload(email: str):
    return {
        "first_name": "Dana",
        "last_name": "Scully",
        "email": email,
        "phone": "555-2020",
        "specialty": "Internal Medicine",
        "license_number": "LIC-12345",
        "license_state": "CA",
        "license_country": "USA",
        "npi_number": "1234567890",
        "taxonomy_code": "207R00000X",
        "clinic_name": "MediTrack Clinic",
        "clinic_address": "123 Market St",
        "clinic_city": "San Francisco",
        "clinic_state": "CA",
        "clinic_zip": "94103",
        "clinic_country": "USA",
        "password": "DoctorPass1!",
        "confirm_password": "DoctorPass1!",
    }


def test_public_signup_creates_admin_and_returns_token(client):
    response = client.post("/api/v1/auth/signup", json=_signup_payload("newdoc@example.com"))
    assert response.status_code == 201
    body = response.json()
    assert "access_token" in body
    assert body["user"]["email"] == "newdoc@example.com"
    assert body["user"]["role"] == UserRole.admin.value

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "newdoc@example.com", "password": "DoctorPass1!"},
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()


def test_signup_rejects_duplicate_email(client):
    payload = _signup_payload("dupe@example.com")
    first = client.post("/api/v1/auth/signup", json=payload)
    assert first.status_code == 201

    duplicate = client.post("/api/v1/auth/signup", json=payload)
    assert duplicate.status_code == 400
    assert duplicate.json()["detail"] == "Email already registered"


def test_change_password_success(client):
    headers = get_admin_headers(client)
    resp = client.post(
        "/api/v1/users/change-password",
        headers=headers,
        json={
            "old_password": "adminpass",
            "new_password": "NewStrongPass1!",
            "confirm_new_password": "NewStrongPass1!",
        },
    )
    assert resp.status_code == 200
    assert resp.json()["detail"] == "Password updated successfully"

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "NewStrongPass1!"},
    )
    assert login_resp.status_code == 200


def test_change_password_wrong_old_password(client):
    headers = get_admin_headers(client)
    resp = client.post(
        "/api/v1/users/change-password",
        headers=headers,
        json={
            "old_password": "wrongpass",
            "new_password": "AnotherPass1!",
            "confirm_new_password": "AnotherPass1!",
        },
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Old password is incorrect"


def test_change_password_accepts_put(client):
    headers = get_admin_headers(client)
    resp = client.put(
        "/api/v1/users/change-password",
        headers=headers,
        json={
            "old_password": "adminpass",
            "new_password": "PutPass123!",
            "confirm_new_password": "PutPass123!",
        },
    )
    assert resp.status_code == 200
    assert resp.json()["detail"] == "Password updated successfully"
