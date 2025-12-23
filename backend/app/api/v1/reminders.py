from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_admin
from app.db.session import get_db
from app.models.user import User
from app.services.reminder_service import dispatch_reminders

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.post("/run")
def run_reminders(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return dispatch_reminders(db)
