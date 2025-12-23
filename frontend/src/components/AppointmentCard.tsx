import { CalendarDaysIcon, PencilSquareIcon, UserCircleIcon } from "@heroicons/react/24/outline";

import { Appointment } from "../services/appointments";

interface Props {
  appointment: Appointment;
}

const statusColors: Record<string, string> = {
  Scheduled: "bg-brand/10 text-brand",
  Completed: "bg-accent-emerald/10 text-accent-emerald",
  Cancelled: "bg-accent-rose/10 text-accent-rose"
};

export const AppointmentCard = ({ appointment }: Props) => {
  const statusStyle = statusColors[appointment.status] ?? "bg-slate-100 text-slate-600";

  return (
    <div className="glass-card flex flex-col gap-3 border border-white/60 p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{appointment.department || "General"}</p>
          <h3 className="text-lg font-semibold text-slate-900">{appointment.doctor_name}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle}`}>
          {appointment.status}
        </span>
      </div>
      {appointment.patient && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <UserCircleIcon className="h-4 w-4" />
          <span>{appointment.patient.full_name}</span>
        </div>
      )}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <CalendarDaysIcon className="h-4 w-4" />
        {new Date(appointment.appointment_datetime).toLocaleString()}
      </div>
      {appointment.notes && (
        <div className="flex items-start gap-2 rounded-2xl bg-surface-subtle px-3 py-2 text-sm text-slate-500">
          <PencilSquareIcon className="h-4 w-4" />
          {appointment.notes}
        </div>
      )}
    </div>
  );
};
