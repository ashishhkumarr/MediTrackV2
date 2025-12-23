import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ErrorState } from "../components/ErrorState";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { TextAreaField } from "../components/ui/FormField";
import { SectionHeader } from "../components/ui/SectionHeader";
import { usePatient, usePatientAppointments, useUpdatePatientNotes } from "../hooks/usePatients";
import { Appointment, AppointmentStatus } from "../services/appointments";

const statusStyles: Record<AppointmentStatus, string> = {
  Scheduled: "bg-accent-sky/10 text-accent-sky",
  Completed: "bg-accent-emerald/10 text-accent-emerald",
  Cancelled: "bg-accent-rose/10 text-accent-rose"
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
};

const formatDateTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown time";
  return parsed.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
};

const getApiErrorMessage = (error: any) => {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) {
    const first = detail[0];
    if (typeof first === "string") {
      return detail.join(" ");
    }
    if (first?.msg) {
      return first.msg;
    }
  }
  if (typeof detail === "string") {
    return detail;
  }
  return "We couldn't save medical notes. Please try again.";
};

const DetailSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-5 w-40 rounded-full bg-slate-200/70" />
    <Card className="space-y-4">
      <div className="h-6 w-48 rounded-full bg-slate-200/70" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="h-16 rounded-2xl border border-slate-100 bg-slate-100"
          />
        ))}
      </div>
    </Card>
    <Card className="space-y-4">
      <div className="h-6 w-48 rounded-full bg-slate-200/70" />
      <div className="h-36 rounded-2xl bg-slate-100" />
    </Card>
    <Card className="space-y-4">
      <div className="h-6 w-56 rounded-full bg-slate-200/70" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`appt-${index}`} className="h-14 rounded-2xl bg-slate-100" />
        ))}
      </div>
    </Card>
  </div>
);

const PatientDetailPage = () => {
  const { id } = useParams();
  const patientId = Number(id);
  const {
    data: patient,
    isLoading: patientLoading,
    error: patientError
  } = usePatient(patientId);
  const {
    data: appointments,
    isLoading: appointmentsLoading,
    error: appointmentsError
  } = usePatientAppointments(patientId);
  const updateNotes = useUpdatePatientNotes();
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  useEffect(() => {
    setNotes(patient?.notes ?? "");
  }, [patient?.notes]);

  useEffect(() => {
    if (!notesSaved) return;
    const timer = window.setTimeout(() => setNotesSaved(false), 3000);
    return () => window.clearTimeout(timer);
  }, [notesSaved]);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const upcomingList: Appointment[] = [];
    const pastList: Appointment[] = [];
    (appointments ?? []).forEach((appointment) => {
      const time = new Date(appointment.appointment_datetime).getTime();
      if (!Number.isNaN(time) && time >= now) {
        upcomingList.push(appointment);
      } else {
        pastList.push(appointment);
      }
    });
    upcomingList.sort(
      (a, b) =>
        new Date(a.appointment_datetime).getTime() - new Date(b.appointment_datetime).getTime()
    );
    pastList.sort(
      (a, b) =>
        new Date(b.appointment_datetime).getTime() - new Date(a.appointment_datetime).getTime()
    );
    return { upcoming: upcomingList, past: pastList };
  }, [appointments]);

  const isNotesDirty = notes !== (patient?.notes ?? "");

  const handleSaveNotes = async () => {
    setNotesError(null);
    const payloadNotes = notes.trim();
    try {
      const updated = await updateNotes.mutateAsync({
        patientId,
        payload: { notes: payloadNotes.length ? payloadNotes : null }
      });
      setNotes(updated.notes ?? "");
      setNotesSaved(true);
    } catch (error: any) {
      setNotesError(getApiErrorMessage(error));
    }
  };

  if (patientLoading) return <DetailSkeleton />;
  if (patientError || !patient) {
    return (
      <ErrorState message="Patient record not found. Return to the patients list and try again." />
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/patients" className="text-sm font-medium text-slate-500 hover:text-brand">
        ← Back to Patients
      </Link>

      <Card className="animate-fadeIn">
        <SectionHeader
          title="Patient demographics"
          description="Core contact and profile details."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-surface-subtle px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Full name</p>
            <p className="mt-1 text-sm text-slate-700">{patient.full_name}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-surface-subtle px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Date of birth</p>
            <p className="mt-1 text-sm text-slate-700">{formatDate(patient.date_of_birth)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-surface-subtle px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Sex</p>
            <p className="mt-1 text-sm text-slate-700">{patient.sex || "—"}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-surface-subtle px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
            <p className="mt-1 text-sm text-slate-700">{patient.email || "—"}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-surface-subtle px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Phone</p>
            <p className="mt-1 text-sm text-slate-700">{patient.phone || "—"}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-surface-subtle px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Address</p>
            <p className="mt-1 text-sm text-slate-700">{patient.address || "—"}</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionHeader
          title="Medical notes"
          description="Document clinical observations and follow-ups."
        />
        <TextAreaField
          label="Medical Notes"
          name="medical_notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Add patient care notes for the clinical team."
        />
        {notesSaved && (
          <div className="rounded-2xl border border-accent-emerald/30 bg-accent-emerald/10 px-4 py-3 text-sm text-accent-emerald">
            Notes saved successfully.
          </div>
        )}
        {notesError && <ErrorState message={notesError} />}
        <div className="flex flex-wrap justify-end">
          <Button
            type="button"
            onClick={handleSaveNotes}
            isLoading={updateNotes.isPending}
            disabled={updateNotes.isPending || !isNotesDirty}
          >
            Save Notes
          </Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionHeader
          title="Appointment history"
          description="Upcoming and previous visits for this patient."
        />
        {appointmentsLoading && (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`loading-${index}`} className="h-14 rounded-2xl bg-slate-100" />
            ))}
          </div>
        )}
        {appointmentsError && (
          <ErrorState message="We couldn't load appointment history for this patient." />
        )}
        {!appointmentsLoading && !appointmentsError && (
          <div className="space-y-6">
            {!appointments?.length && (
              <p className="rounded-2xl bg-surface-subtle px-4 py-6 text-center text-sm text-slate-500">
                No appointments yet. Schedule the first visit when the patient is ready.
              </p>
            )}
            {!!appointments?.length && (
              <>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Upcoming</p>
                  {upcoming.length ? (
                    upcoming.map((appointment) => (
                      <div
                        key={`upcoming-${appointment.id}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatDateTime(appointment.appointment_datetime)}
                          </p>
                          <p className="text-xs text-slate-400">
                            {appointment.department || "General"} · Dr. {appointment.doctor_name}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[appointment.status]}`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-surface-subtle px-4 py-4 text-sm text-slate-500">
                      No upcoming appointments scheduled.
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Past</p>
                  {past.length ? (
                    past.map((appointment) => (
                      <div
                        key={`past-${appointment.id}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatDateTime(appointment.appointment_datetime)}
                          </p>
                          <p className="text-xs text-slate-400">
                            {appointment.department || "General"} · Dr. {appointment.doctor_name}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[appointment.status]}`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-surface-subtle px-4 py-4 text-sm text-slate-500">
                      No past appointments to show.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PatientDetailPage;
