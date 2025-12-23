import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import appointments, auth, patients, users
from app.core.config import settings
from app.core.security import get_password_hash
from app.db import base  # noqa: F401 ensures models imported
from app.db.session import SessionLocal, engine
from app.models.user import User, UserRole
from app.services.reminder_service import scheduler

logger = logging.getLogger("meditrack")


def create_default_admin():
    try:
        db = SessionLocal()
    except Exception as exc:  # pragma: no cover - safeguards startup when DB unavailable
        logger.warning("Skipping default admin creation: %s", exc)
        return
    try:
        existing = (
            db.query(User).filter(User.email == settings.ADMIN_DEFAULT_EMAIL).first()
        )
        if not existing:
            admin = User(
                email=settings.ADMIN_DEFAULT_EMAIL,
                hashed_password=get_password_hash(settings.ADMIN_DEFAULT_PASSWORD),
                full_name="MediTrack Admin",
                role=UserRole.admin,
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        base.Base.metadata.create_all(bind=engine)
        create_default_admin()
    except Exception as exc:  # pragma: no cover - keeps app booting during migrations/tests
        logger.warning("Database bootstrap skipped: %s", exc)
    if not scheduler.running:
        scheduler.start()
    yield
    if scheduler.running:
        scheduler.shutdown()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(patients.router, prefix=settings.API_V1_STR)
app.include_router(appointments.router, prefix=settings.API_V1_STR)


@app.get("/")
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}
