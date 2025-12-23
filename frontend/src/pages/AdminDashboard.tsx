import {
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

import { AppointmentCard } from "../components/AppointmentCard";
import { ErrorState } from "../components/ErrorState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useAppointments } from "../hooks/useAppointments";
import { usePatients } from "../hooks/usePatients";

const AdminDashboard = () => {
  const { data: appointments, isLoading: apptLoading, error: apptError } = useAppointments();
  const { data: patients, isLoading: patientLoading, error: patientError } = usePatients();
  const navigate = useNavigate();

  if (apptLoading || patientLoading) {
    return <LoadingSpinner />;
  }

  if (apptError || patientError) {
    return <ErrorState message="Unable to load dashboard data." />;
  }

  const scheduledCount = appointments ? appointments.filter((appt) => appt.status === "Scheduled").length : 0;
  const completedCount = appointments ? appointments.filter((appt) => appt.status === "Completed").length : 0;

  const quickActions = [
    { label: "New appointment", to: "/appointments/create" },
    { label: "View appointments", to: "/appointments" },
    { label: "Edit clinic profile", to: "/profile/edit" }
  ];

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Clinical Command Center"
        description="Monitor patient volume, appointments, and take quick action."
        action={
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Refresh Metrics
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex items-center gap-4">
          <div className="rounded-2xl bg-brand/10 p-3 text-brand">
            <UserGroupIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Active Patients</p>
            <p className="text-3xl font-semibold text-slate-900">{patients?.length ?? 0}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="rounded-2xl bg-accent-sky/10 p-3 text-accent-sky">
            <ClipboardDocumentCheckIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Scheduled Visits</p>
            <p className="text-3xl font-semibold text-slate-900">{scheduledCount}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="rounded-2xl bg-accent-emerald/10 p-3 text-accent-emerald">
            <HeartIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Completed Today</p>
            <p className="text-3xl font-semibold text-slate-900">{completedCount}</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <SectionHeader title="Upcoming appointments" description="The next visits requiring coordination." />
          <div className="grid gap-4 md:grid-cols-2">
            {appointments?.slice(0, 6).map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
            {!appointments?.length && (
              <p className="rounded-2xl bg-surface-subtle px-4 py-6 text-center text-sm text-slate-500">
                No appointments scheduled.
              </p>
            )}
          </div>
        </Card>
        <Card>
          <SectionHeader title="Quick actions" />
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Button
                key={action.to}
                variant="secondary"
                className="w-full justify-between"
                onClick={() => navigate(action.to)}
              >
                {action.label}
                <ClipboardDocumentListIcon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
