import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppointmentForm } from "../components/AppointmentForm";
import { ErrorState } from "../components/ErrorState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useCreateAppointment } from "../hooks/useAppointments";
import { usePatients } from "../hooks/usePatients";

const CreateAppointmentPage = () => {
  const navigate = useNavigate();
  const { data: patients, isLoading, error } = usePatients();
  const mutation = useCreateAppointment();
  const [apiError, setApiError] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Unable to load patients." />;

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
    return "We couldn't schedule this appointment. Please try again.";
  };

  const handleSubmit = async (values: any) => {
    setApiError(null);
    const payload = {
      patient_id: values.patient_id,
      appointment_datetime: values.appointment_datetime,
      appointment_end_datetime: values.appointment_end_datetime || undefined,
      doctor_name: values.doctor_name || undefined,
      department: values.department || undefined,
      notes: values.notes || undefined
    };
    try {
      await mutation.mutateAsync(payload);
      navigate("/appointments", { state: { successMessage: "Appointment scheduled" } });
    } catch (submitError: any) {
      setApiError(getApiErrorMessage(submitError));
    }
  };

  return (
    <Card className="animate-fadeIn">
      <SectionHeader
        title="Create appointment"
        description="Schedule a new visit with timing, clinician, and notes."
      />
      {patients && patients.length > 0 ? (
        <div className="mt-4">
          <AppointmentForm
            patients={patients}
            onSubmit={handleSubmit}
            isSubmitting={mutation.isPending}
          />
          {apiError && (
            <div className="mt-4">
              <ErrorState message={apiError} />
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-surface-subtle px-4 py-6 text-sm text-slate-500">
          <p>Add a patient profile before scheduling appointments.</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => navigate("/patients?new=1")}
          >
            Add a patient
          </Button>
        </div>
      )}
    </Card>
  );
};

export default CreateAppointmentPage;
