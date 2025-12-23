import { useNavigate } from "react-router-dom";

import { AppointmentForm } from "../components/AppointmentForm";
import { ErrorState } from "../components/ErrorState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Card } from "../components/ui/Card";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useCreateAppointment } from "../hooks/useAppointments";
import { usePatients } from "../hooks/usePatients";

const CreateAppointmentPage = () => {
  const navigate = useNavigate();
  const { data: patients, isLoading, error } = usePatients();
  const mutation = useCreateAppointment();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Unable to load patients" />;

  const handleSubmit = async (values: any) => {
    await mutation.mutateAsync(values);
    navigate("/appointments");
  };

  return (
    <Card className="animate-fadeIn">
      <SectionHeader
        title="Create appointment"
        description="Schedule a new visit with doctor, department, and notes."
      />
      {patients && patients.length > 0 ? (
        <div className="mt-4">
          <AppointmentForm
            patients={patients}
            onSubmit={handleSubmit}
            isSubmitting={mutation.isPending}
          />
          {mutation.isError && (
            <p className="mt-4 text-sm text-accent-rose">Failed to create appointment. Please try again.</p>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-surface-subtle px-4 py-6 text-sm text-slate-500">
          Add a patient profile before scheduling appointments.
        </p>
      )}
    </Card>
  );
};

export default CreateAppointmentPage;
