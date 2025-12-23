import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import { ErrorState } from "../components/ErrorState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { InputField, TextAreaField } from "../components/ui/FormField";
import { SectionHeader } from "../components/ui/SectionHeader";
import {
  useAppointments,
  useCancelAppointment,
  useCompleteAppointment,
  useUpdateAppointment
} from "../hooks/useAppointments";
import { Appointment, AppointmentStatus } from "../services/appointments";

type AppointmentFormState = {
  appointment_datetime: string;
  appointment_end_datetime: string;
  doctor_name: string;
  department: string;
  notes: string;
};

const statusStyles: Record<AppointmentStatus, string> = {
  Scheduled: "bg-accent-sky/10 text-accent-sky",
  Completed: "bg-accent-emerald/10 text-accent-emerald",
  Cancelled: "bg-accent-rose/10 text-accent-rose"
};

const toInputValue = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (amount: number) => amount.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const formatDateTimeCell = (appointment: Appointment) => {
  const start = new Date(appointment.appointment_datetime);
  if (Number.isNaN(start.getTime())) {
    return { dateLabel: "—", timeRange: "—" };
  }
  const end = appointment.appointment_end_datetime
    ? new Date(appointment.appointment_end_datetime)
    : null;
  const dateLabel = start.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  const startTime = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const endTime =
    end && !Number.isNaN(end.getTime())
      ? end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : "—";
  return { dateLabel, timeRange: `${startTime} - ${endTime}` };
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
  return "We couldn't update this appointment. Please try again.";
};

const AppointmentListPage = () => {
  const { data, isLoading, error } = useAppointments();
  const updateAppointment = useUpdateAppointment();
  const cancelAppointment = useCancelAppointment();
  const completeAppointment = useCompleteAppointment();
  const navigate = useNavigate();

  const [showCancelled, setShowCancelled] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [formState, setFormState] = useState<AppointmentFormState>({
    appointment_datetime: "",
    appointment_end_datetime: "",
    doctor_name: "",
    department: "",
    notes: ""
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AppointmentFormState, string>>>(
    {}
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isModalOpen = isViewOpen || isEditOpen || isCancelOpen;

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!isModalOpen) return;
    document.body.classList.add("overflow-hidden");
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isModalOpen]);

  const filteredAppointments = useMemo(() => {
    const appointments = data ?? [];
    const filtered = showCancelled
      ? appointments
      : appointments.filter((appointment) => appointment.status !== "Cancelled");
    return filtered.sort(
      (a, b) =>
        new Date(a.appointment_datetime).getTime() - new Date(b.appointment_datetime).getTime()
    );
  }, [data, showCancelled]);

  const handleView = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsViewOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setFormErrors({});
    setActionError(null);
    setFormState({
      appointment_datetime: toInputValue(appointment.appointment_datetime),
      appointment_end_datetime: toInputValue(appointment.appointment_end_datetime),
      doctor_name: appointment.doctor_name,
      department: appointment.department ?? "",
      notes: appointment.notes ?? ""
    });
    setIsEditOpen(true);
  };

  const handleCancelPrompt = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setActionError(null);
    setIsCancelOpen(true);
  };

  const closeModals = () => {
    setIsViewOpen(false);
    setIsEditOpen(false);
    setIsCancelOpen(false);
    setSelectedAppointment(null);
    setActionError(null);
  };

  const handleFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof AppointmentFormState, string>> = {};
    if (!formState.appointment_datetime) {
      nextErrors.appointment_datetime = "Required";
    }
    if (!formState.doctor_name.trim()) {
      nextErrors.doctor_name = "Required";
    }
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    if (!selectedAppointment) return;
    if (!validateForm()) return;
    try {
      await updateAppointment.mutateAsync({
        appointmentId: selectedAppointment.id,
        payload: {
          appointment_datetime: formState.appointment_datetime,
          appointment_end_datetime: formState.appointment_end_datetime || null,
          doctor_name: formState.doctor_name.trim(),
          department: formState.department.trim() || undefined,
          notes: formState.notes.trim() || undefined
        }
      });
      setSuccessMessage("Appointment updated successfully.");
      closeModals();
    } catch (submitError: any) {
      setActionError(getApiErrorMessage(submitError));
    }
  };

  const handleCancel = async () => {
    if (!selectedAppointment) return;
    setActionError(null);
    try {
      await cancelAppointment.mutateAsync(selectedAppointment.id);
      setSuccessMessage("Appointment cancelled.");
      closeModals();
    } catch (cancelError: any) {
      setActionError(getApiErrorMessage(cancelError));
    }
  };

  const handleComplete = async (appointmentId: number) => {
    setActionError(null);
    try {
      await completeAppointment.mutateAsync(appointmentId);
      setSuccessMessage("Appointment marked completed.");
    } catch (completeError: any) {
      setActionError(getApiErrorMessage(completeError));
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Unable to fetch appointments." />;

  return (
    <Card className="animate-fadeIn space-y-5">
      <SectionHeader
        title="Appointments overview"
        description="Every scheduled visit across the clinic."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-500">
              <input
                type="checkbox"
                checked={showCancelled}
                onChange={(event) => setShowCancelled(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/40"
              />
              Show cancelled
            </label>
            <Button onClick={() => navigate("/appointments/create")} className="shadow-card">
              Create appointment
            </Button>
          </div>
        }
      />

      {successMessage && (
        <div className="rounded-2xl border border-accent-emerald/30 bg-accent-emerald/10 px-4 py-3 text-sm text-accent-emerald">
          {successMessage}
        </div>
      )}

      {actionError && !isEditOpen && !isCancelOpen && (
        <ErrorState message={actionError} />
      )}

      {!!filteredAppointments.length && (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full text-left text-sm text-slate-600">
            <thead className="bg-surface-subtle text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Date & Time</th>
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAppointments.map((appointment) => {
                const { dateLabel, timeRange } = formatDateTimeCell(appointment);
                const patientName =
                  appointment.patient?.full_name ?? `Patient #${appointment.patient_id}`;
                return (
                  <tr key={appointment.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{patientName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">{dateLabel}</p>
                      <p className="text-xs text-slate-400">{timeRange}</p>
                    </td>
                    <td className="px-4 py-3">{appointment.doctor_name}</td>
                    <td className="px-4 py-3">{appointment.department || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[appointment.status]}`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="ghost" onClick={() => handleView(appointment)}>
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleEdit(appointment)}
                          disabled={appointment.status === "Cancelled"}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleComplete(appointment.id)}
                          disabled={
                            appointment.status === "Completed" ||
                            appointment.status === "Cancelled"
                          }
                        >
                          Mark Completed
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleCancelPrompt(appointment)}
                          disabled={appointment.status === "Cancelled"}
                        >
                          Cancel
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!filteredAppointments.length && (
        <p className="rounded-2xl bg-surface-subtle px-4 py-6 text-center text-sm text-slate-500">
          {showCancelled
            ? "No appointments found yet."
            : "No active appointments scheduled yet."}
        </p>
      )}

      {isViewOpen &&
        selectedAppointment &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-6">
            <div className="absolute inset-0" onClick={closeModals} />
            <div className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-card max-h-[90vh]">
              <div className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-white/95 px-6 pb-4 pt-5 backdrop-blur">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Appointment details</h3>
                  <p className="text-sm text-slate-500">
                    Review appointment information and status.
                  </p>
                </div>
                <Button variant="ghost" type="button" onClick={closeModals}>
                  Close
                </Button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-surface-subtle px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Patient</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {selectedAppointment.patient?.full_name ??
                        `Patient #${selectedAppointment.patient_id}`}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-surface-subtle px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
                    <p className="mt-1 text-sm text-slate-700">{selectedAppointment.status}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-surface-subtle px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Date & Time</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {formatDateTimeCell(selectedAppointment).dateLabel}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDateTimeCell(selectedAppointment).timeRange}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-surface-subtle px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Doctor</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {selectedAppointment.doctor_name}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-surface-subtle px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Department</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {selectedAppointment.department || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-surface-subtle px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Notes</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {selectedAppointment.notes || "—"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
                <Button variant="secondary" type="button" onClick={closeModals}>
                  Close
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {isEditOpen &&
        selectedAppointment &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-6">
            <div className="absolute inset-0" onClick={closeModals} />
            <div className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-card max-h-[90vh]">
              <div className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-white/95 px-6 pb-4 pt-5 backdrop-blur">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Reschedule appointment</h3>
                  <p className="text-sm text-slate-500">
                    Update timing, clinician details, or notes.
                  </p>
                </div>
                <Button variant="ghost" type="button" onClick={closeModals}>
                  Close
                </Button>
              </div>
              <form onSubmit={handleUpdate} className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField
                      label="Start time"
                      type="datetime-local"
                      name="appointment_datetime"
                      value={formState.appointment_datetime}
                      onChange={handleFieldChange}
                      error={formErrors.appointment_datetime}
                      required
                    />
                    <InputField
                      label="End time (optional)"
                      type="datetime-local"
                      name="appointment_end_datetime"
                      value={formState.appointment_end_datetime}
                      onChange={handleFieldChange}
                    />
                    <InputField
                      label="Doctor"
                      name="doctor_name"
                      value={formState.doctor_name}
                      onChange={handleFieldChange}
                      error={formErrors.doctor_name}
                      required
                    />
                    <InputField
                      label="Department"
                      name="department"
                      value={formState.department}
                      onChange={handleFieldChange}
                    />
                  </div>
                  <TextAreaField
                    label="Notes"
                    name="notes"
                    value={formState.notes}
                    onChange={handleFieldChange}
                    placeholder="Add visit notes or prep instructions."
                  />
                  {actionError && <ErrorState message={actionError} />}
                </div>
                <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
                  <Button variant="secondary" type="button" onClick={closeModals}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={updateAppointment.isPending}
                    disabled={updateAppointment.isPending}
                  >
                    {updateAppointment.isPending ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {isCancelOpen &&
        selectedAppointment &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-6">
            <div className="absolute inset-0" onClick={closeModals} />
            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-card">
              <div className="border-b border-slate-100 px-6 pb-4 pt-5">
                <h3 className="text-lg font-semibold text-slate-900">Cancel appointment</h3>
                <p className="text-sm text-slate-500">
                  Are you sure you want to cancel this appointment? This will mark it as cancelled.
                </p>
              </div>
              <div className="space-y-3 px-6 py-5 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-900">Patient:</span>{" "}
                  {selectedAppointment.patient?.full_name ??
                    `Patient #${selectedAppointment.patient_id}`}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Date:</span>{" "}
                  {formatDateTimeCell(selectedAppointment).dateLabel}
                </p>
                {actionError && <ErrorState message={actionError} />}
              </div>
              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-6 py-4">
                <Button variant="secondary" type="button" onClick={closeModals}>
                  Keep appointment
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  isLoading={cancelAppointment.isPending}
                  disabled={cancelAppointment.isPending}
                >
                  {cancelAppointment.isPending ? "Cancelling..." : "Confirm cancel"}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </Card>
  );
};

export default AppointmentListPage;
