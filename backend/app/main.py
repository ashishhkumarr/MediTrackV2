import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import DateTime, String, Text, inspect, text

from app.api.v1 import appointments, auth, patients, reminders, users
from app.core.config import settings
from app.core.security import get_password_hash
from app.db import base  # noqa: F401 ensures models imported
from app.db.session import SessionLocal, engine
from app.models.user import User, UserRole
from app.services.reminder_service import scheduler

logger = logging.getLogger("meditrack")

def ensure_schema_columns():
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    desired_columns = {
        "patients": [
            ("first_name", String()),
            ("last_name", String()),
            ("sex", String()),
            ("address", Text()),
        ],
        "appointments": [
            ("appointment_end_datetime", DateTime()),
            ("reminder_sent_at", DateTime()),
        ],
    }

    with engine.begin() as connection:
        for table_name, columns in desired_columns.items():
            if table_name not in existing_tables:
                continue
            existing_columns = {
                column["name"] for column in inspector.get_columns(table_name)
            }
            for column_name, column_type in columns:
                if column_name in existing_columns:
                    continue
                column_sql = column_type.compile(dialect=connection.dialect)
                connection.execute(
                    text(
                        f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_sql}"
                    )
                )


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
        ensure_schema_columns()
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
app.include_router(reminders.router, prefix=settings.API_V1_STR)


@app.get("/")
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}
