import logging
from datetime import datetime, timedelta
from smtplib import SMTP, SMTPException

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import Patient

logger = logging.getLogger("reminders")


def send_email(recipient: str, subject: str, message: str) -> None:
    if not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD]):
        logger.info("Email skipped for %s: SMTP not configured", recipient)
        return
    try:
        with SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            body = f"Subject: {subject}\n\n{message}"
            smtp.sendmail(settings.SMTP_USER, recipient, body)
    except SMTPException as exc:
        logger.error("Failed to send email to %s: %s", recipient, exc)


def process_reminders():
    try:
        db: Session = SessionLocal()
    except Exception as exc:  # pragma: no cover - scheduler resilience
        logger.warning("Reminder service unavailable: %s", exc)
        return
    try:
        window_start = datetime.utcnow()
        window_end = window_start + timedelta(hours=settings.REMINDER_HOURS_BEFORE)
        appointments = (
            db.query(Appointment)
            .filter(
                Appointment.status == AppointmentStatus.scheduled,
                Appointment.appointment_datetime.between(window_start, window_end),
            )
            .all()
        )
        for appointment in appointments:
            patient: Patient = appointment.patient
            if patient and patient.email:
                send_email(
                    patient.email,
                    "Appointment Reminder",
                    f"Dear {patient.full_name},\n\n"
                    f"This is a reminder for your appointment with "
                    f"{appointment.doctor_name} on "
                    f"{appointment.appointment_datetime:%Y-%m-%d %H:%M}.",
                )
            else:
                logger.info(
                    "Skipping reminder for appointment %s due to missing patient email",
                    appointment.id,
                )
    finally:
        db.close()


scheduler = BackgroundScheduler()
scheduler.add_job(process_reminders, "interval", hours=1, id="reminder_job")
