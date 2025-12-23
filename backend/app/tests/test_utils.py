from app.core.security import create_access_token, get_password_hash, verify_password


def test_password_hash_roundtrip():
    raw = "SuperSecret123"
    hashed = get_password_hash(raw)
    assert verify_password(raw, hashed)


def test_create_access_token():
    token = create_access_token({"sub": "1"})
    assert isinstance(token, str)
