from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "MediTrack"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "changeme"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"
    DATABASE_URL: str = (
        "postgresql+psycopg2://postgres:postgres@db:5432/meditrack"
    )
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM: str | None = None
    SMTP_USE_TLS: bool = True
    EMAIL_ENABLED: bool = False
    REMINDER_HOURS_BEFORE: int = 24
    REMINDER_WINDOW_HOURS: int = 24
    REMINDER_LOOKAHEAD_MINUTES: int = 5
    APPOINTMENT_DEFAULT_DURATION_MINUTES: int = 30
    ADMIN_DEFAULT_EMAIL: str = "admin@meditrack.com"
    ADMIN_DEFAULT_PASSWORD: str = "ChangeMe123!"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
