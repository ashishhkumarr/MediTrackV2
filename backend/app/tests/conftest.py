import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.user import User, UserRole

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, future=True
)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        admin = User(
            email="admin@test.com",
            hashed_password=get_password_hash("adminpass"),
            full_name="Admin User",
            role=UserRole.admin,
        )
        session.add(admin)
        session.commit()
        session.refresh(admin)
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
