import logging
import smtplib
from datetime import datetime
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("meditrack.email")


def _format_datetime(value: datetime) -> str:
    formatted = value.strftime("%b %d, %Y %I:%M %p")
    return formatted.replace(" 0", " ")


def _format_time_range(start_time: datetime, end_time: datetime | None) -> str:
    if not end_time:
        return _format_datetime(start_time)
    return f"{_format_datetime(start_time)} - {_format_datetime(end_time)}"


def _build_details_lines(
    start_time: datetime,
    end_time: datetime | None,
    doctor: str | None,
    department: str | None,
    notes: str | None,
):
    return [
        f"Date and time: {_format_time_range(start_time, end_time)}",
        f"Doctor: {doctor or 'TBD'}",
        f"Department: {department or '—'}",
        f"Notes: {notes or '—'}",
    ]


def build_confirmation_email(
    patient_name: str,
    clinic_name: str,
    start_time: datetime,
    end_time: datetime | None,
    doctor: str | None,
    department: str | None,
    notes: str | None,
):
    subject = f"Appointment confirmation - {clinic_name}"
    details = _build_details_lines(start_time, end_time, doctor, department, notes)
    html_body = f"""
    <p>Hello {patient_name},</p>
    <p>Your appointment has been confirmed with {clinic_name}.</p>
    <p><strong>Appointment details</strong><br/>
    {'<br/>'.join(details)}</p>
    <p>If you need to reschedule, contact the clinic.</p>
    """
    text_body = "\n".join(
        [
            f"Hello {patient_name},",
            f"Your appointment has been confirmed with {clinic_name}.",
            "Appointment details:",
            *details,
            "If you need to reschedule, contact the clinic.",
        ]
    )
    return subject, html_body.strip(), text_body


def build_update_email(
    patient_name: str,
    clinic_name: str,
    old_start_time: datetime,
    old_end_time: datetime | None,
    old_doctor: str | None,
    old_department: str | None,
    old_notes: str | None,
    new_start_time: datetime,
    new_end_time: datetime | None,
    new_doctor: str | None,
    new_department: str | None,
    new_notes: str | None,
):
    subject = f"Appointment updated - {clinic_name}"
    old_details = _build_details_lines(
        old_start_time, old_end_time, old_doctor, old_department, old_notes
    )
    new_details = _build_details_lines(
        new_start_time, new_end_time, new_doctor, new_department, new_notes
    )
    html_body = f"""
    <p>Hello {patient_name},</p>
    <p>Your appointment details have been updated.</p>
    <p><strong>Previous details</strong><br/>
    {'<br/>'.join(old_details)}</p>
    <p><strong>Updated details</strong><br/>
    {'<br/>'.join(new_details)}</p>
    <p>If you have questions, please contact the clinic.</p>
    """
    text_body = "\n".join(
        [
            f"Hello {patient_name},",
            "Your appointment details have been updated.",
            "Previous details:",
            *old_details,
            "Updated details:",
            *new_details,
            "If you have questions, please contact the clinic.",
        ]
    )
    return subject, html_body.strip(), text_body


def build_cancellation_email(
    patient_name: str,
    clinic_name: str,
    start_time: datetime,
    end_time: datetime | None,
    doctor: str | None,
    department: str | None,
    notes: str | None,
):
    subject = f"Appointment cancelled - {clinic_name}"
    details = _build_details_lines(start_time, end_time, doctor, department, notes)
    html_body = f"""
    <p>Hello {patient_name},</p>
    <p>Your appointment with {clinic_name} has been cancelled.</p>
    <p><strong>Original appointment</strong><br/>
    {'<br/>'.join(details)}</p>
    <p>Please contact the clinic if you need to reschedule.</p>
    """
    text_body = "\n".join(
        [
            f"Hello {patient_name},",
            f"Your appointment with {clinic_name} has been cancelled.",
            "Original appointment:",
            *details,
            "Please contact the clinic if you need to reschedule.",
        ]
    )
    return subject, html_body.strip(), text_body


def build_reminder_email(
    patient_name: str,
    clinic_name: str,
    start_time: datetime,
    end_time: datetime | None,
    doctor: str | None,
    department: str | None,
    notes: str | None,
):
    subject = f"Appointment reminder - {clinic_name}"
    details = _build_details_lines(start_time, end_time, doctor, department, notes)
    html_body = f"""
    <p>Hello {patient_name},</p>
    <p>This is a reminder about your upcoming appointment with {clinic_name}.</p>
    <p><strong>Appointment details</strong><br/>
    {'<br/>'.join(details)}</p>
    <p>If you need to reschedule, contact the clinic.</p>
    """
    text_body = "\n".join(
        [
            f"Hello {patient_name},",
            f"This is a reminder about your upcoming appointment with {clinic_name}.",
            "Appointment details:",
            *details,
            "If you need to reschedule, contact the clinic.",
        ]
    )
    return subject, html_body.strip(), text_body


def send_email(
    to: str,
    subject: str,
    html_body: str,
    text_body: str | None = None,
) -> None:
    preview_source = text_body or html_body
    preview = " ".join(preview_source.split())[:200]

    if not settings.EMAIL_ENABLED:
        print(f"EMAIL_DEV_MODE to={to} subject={subject} preview={preview}")
        return

    smtp_username = settings.SMTP_USERNAME or settings.SMTP_USER
    smtp_from = settings.SMTP_FROM or smtp_username

    if not settings.SMTP_HOST or not smtp_from:
        logger.warning(
            "Email enabled but SMTP configuration is incomplete. To=%s Subject=%s",
            to,
            subject,
        )
        return

    message = EmailMessage()
    message["From"] = smtp_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(text_body or html_body)
    message.add_alternative(html_body, subtype="html")

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if smtp_username and settings.SMTP_PASSWORD:
                server.login(smtp_username, settings.SMTP_PASSWORD)
            server.send_message(message)
        print(f"EMAIL_SENT to={to} subject={subject}")
    except Exception as exc:  # pragma: no cover - network dependent
        logger.error("Failed to send email to %s: %s", to, exc)
