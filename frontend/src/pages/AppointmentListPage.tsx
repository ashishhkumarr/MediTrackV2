import { useNavigate } from "react-router-dom";

import { AppointmentCard } from "../components/AppointmentCard";
import { ErrorState } from "../components/ErrorState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useAppointments } from "../hooks/useAppointments";

const AppointmentListPage = () => {
  const { data, isLoading, error } = useAppointments();
  const navigate = useNavigate();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Unable to fetch appointments." />;

  return (
    <Card className="animate-fadeIn">
      <SectionHeader
        title="Appointments overview"
        description="Every scheduled visit across the clinic."
        action={
          <Button onClick={() => navigate("/appointments/create")} className="shadow-card">
            Create appointment
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((appointment) => (
          <AppointmentCard key={appointment.id} appointment={appointment} />
        ))}
        {!data?.length && (
          <p className="rounded-2xl bg-surface-subtle px-4 py-6 text-center text-sm text-slate-500">
            No appointments scheduled yet.
          </p>
        )}
      </div>
    </Card>
  );
};

export default AppointmentListPage;
