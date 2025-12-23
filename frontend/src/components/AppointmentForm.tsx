import { useEffect, useState } from "react";

import { Button } from "./ui/Button";
import { InputField, TextAreaField } from "./ui/FormField";
import { AppointmentStatus } from "../services/appointments";
import { Patient } from "../services/patients";

interface Props {
  patients: Patient[];
  onSubmit: (values: {
    patient_id: number;
    doctor_name: string;
    department?: string;
    appointment_datetime: string;
    notes?: string;
    status: AppointmentStatus;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
}

export const AppointmentForm = ({ patients, onSubmit, isSubmitting }: Props) => {
  const [formState, setFormState] = useState({
    patient_id: patients[0]?.id ?? 0,
    doctor_name: "",
    department: "",
    appointment_datetime: "",
    notes: "",
    status: "Scheduled" as AppointmentStatus
  });

  useEffect(() => {
    if (patients.length) {
      setFormState((prev) => ({ ...prev, patient_id: patients[0].id }));
    }
  }, [patients]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(formState);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="text-sm font-medium text-slate-600">
        Patient
        <select
          name="patient_id"
          value={formState.patient_id}
          onChange={handleChange}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.full_name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Doctor"
          name="doctor_name"
          value={formState.doctor_name}
          onChange={handleChange}
          placeholder="Dr. Adams"
          required
        />
        <InputField
          label="Department"
          name="department"
          value={formState.department}
          onChange={handleChange}
          placeholder="Cardiology"
        />
      </div>
      <InputField
        label="Appointment Date & Time"
        type="datetime-local"
        name="appointment_datetime"
        value={formState.appointment_datetime}
        onChange={handleChange}
        required
      />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-600">
          Status
          <select
            name="status"
            value={formState.status}
            onChange={handleChange}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </label>
        <TextAreaField
          label="Visit Notes"
          name="notes"
          value={formState.notes}
          onChange={handleChange}
          placeholder="Add patient prep instructions or key reminders…"
        />
      </div>
      <Button type="submit" className="w-full justify-center py-3" isLoading={isSubmitting}>
        {isSubmitting ? "Scheduling..." : "Schedule Appointment"}
      </Button>
    </form>
  );
};
