import logging
from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import Patient
from app.models.user import User, UserRole
from app.services.email import build_reminder_email, send_email

logger = logging.getLogger("reminders")


def _resolve_end_time(start_time, end_time):
    if not start_time:
        return end_time
    return end_time or start_time + timedelta(
        minutes=settings.APPOINTMENT_DEFAULT_DURATION_MINUTES
    )


def _get_clinic_name(db: Session) -> str:
    clinic = (
        db.query(User)
        .filter(User.role == UserRole.admin, User.clinic_name.isnot(None))
        .first()
    )
    return clinic.clinic_name if clinic and clinic.clinic_name else settings.PROJECT_NAME


def dispatch_reminders(db: Session, now: datetime | None = None) -> dict:
    current_time = now or datetime.utcnow()
    window_start = current_time
    window_end = current_time + timedelta(hours=settings.REMINDER_WINDOW_HOURS)
    lookahead_end = current_time + timedelta(
        minutes=settings.REMINDER_LOOKAHEAD_MINUTES
    )
    if lookahead_end > window_end:
        window_end = lookahead_end

    appointments = (
        db.query(Appointment)
        .join(Patient)
        .filter(
            Appointment.status == AppointmentStatus.scheduled,
            Appointment.reminder_sent_at.is_(None),
            Appointment.appointment_datetime >= window_start,
            Appointment.appointment_datetime <= window_end,
            Patient.email.isnot(None),
            Patient.email != "",
        )
        .all()
    )

    processed = len(appointments)
    sent = 0
    skipped = 0

    for appointment in appointments:
        patient: Patient = appointment.patient
        recipient = patient.email.strip() if patient and patient.email else None
        if not recipient:
            skipped += 1
            continue
        print(
            f"EMAIL_TRIGGER event=reminder appointment_id={appointment.id} patient_email={recipient}"
        )
        clinic_name = _get_clinic_name(db)
        subject, html_body, text_body = build_reminder_email(
            patient.full_name,
            clinic_name,
            appointment.appointment_datetime,
            _resolve_end_time(
                appointment.appointment_datetime, appointment.appointment_end_datetime
            ),
            appointment.doctor_name,
            appointment.department,
            appointment.notes,
        )
        send_email(recipient, subject, html_body, text_body)
        appointment.reminder_sent_at = current_time
        db.add(appointment)
        sent += 1

    if sent:
        db.commit()

    skipped += processed - sent
    return {"processed": processed, "sent": sent, "skipped": skipped}


def process_reminders():
    try:
        db: Session = SessionLocal()
    except Exception as exc:  # pragma: no cover - scheduler resilience
        logger.warning("Reminder service unavailable: %s", exc)
        return
    try:
        dispatch_reminders(db)
    finally:
        db.close()


scheduler = BackgroundScheduler()
scheduler.add_job(process_reminders, "interval", hours=1, id="reminder_job")
