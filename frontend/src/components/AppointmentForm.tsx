import { useEffect, useMemo, useState } from "react";

import { Button } from "./ui/Button";
import { InputField, TextAreaField } from "./ui/FormField";
import { Patient } from "../services/patients";

interface Props {
  patients: Patient[];
  onSubmit: (values: {
    patient_id: number;
    doctor_name?: string;
    department?: string;
    appointment_datetime: string;
    appointment_end_datetime?: string;
    notes?: string;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
}

export const AppointmentForm = ({ patients, onSubmit, isSubmitting }: Props) => {
  const [formState, setFormState] = useState({
    patient_id: patients[0]?.id ?? 0,
    appointment_datetime: "",
    appointment_end_datetime: "",
    doctor_name: "",
    department: "",
    notes: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (patients.length) {
      setFormState((prev) => ({ ...prev, patient_id: patients[0].id }));
    }
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed) return patients;
    return patients.filter((patient) => {
      const name = patient.full_name?.toLowerCase() ?? "";
      const email = patient.email?.toLowerCase() ?? "";
      const phone = patient.phone?.toLowerCase() ?? "";
      return name.includes(trimmed) || email.includes(trimmed) || phone.includes(trimmed);
    });
  }, [patients, searchTerm]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formState.patient_id) {
      nextErrors.patient_id = "Select a patient";
    }
    if (!formState.appointment_datetime) {
      nextErrors.appointment_datetime = "Required";
    }
    if (formState.appointment_end_datetime) {
      const startTime = new Date(formState.appointment_datetime).getTime();
      const endTime = new Date(formState.appointment_end_datetime).getTime();
      if (!Number.isNaN(startTime) && !Number.isNaN(endTime) && endTime <= startTime) {
        nextErrors.appointment_end_datetime = "End time must be after start time";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit(formState);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-3">
        <InputField
          label="Search patients"
          placeholder="Search by name, email, or phone"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <label className="text-sm font-medium text-slate-600">
          Patient
          <select
            name="patient_id"
            value={formState.patient_id}
            onChange={handleChange}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            {filteredPatients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.full_name}
              </option>
            ))}
          </select>
          {errors.patient_id && <span className="mt-1 block text-xs text-accent-rose">{errors.patient_id}</span>}
        </label>
        {!filteredPatients.length && (
          <p className="rounded-2xl bg-surface-subtle px-4 py-3 text-sm text-slate-500">
            No patients match your search.
          </p>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Start time"
          type="datetime-local"
          name="appointment_datetime"
          value={formState.appointment_datetime}
          onChange={handleChange}
          error={errors.appointment_datetime}
          required
        />
        <InputField
          label="End time (optional)"
          type="datetime-local"
          name="appointment_end_datetime"
          value={formState.appointment_end_datetime}
          onChange={handleChange}
          error={errors.appointment_end_datetime}
        />
        <InputField
          label="Doctor (optional)"
          name="doctor_name"
          value={formState.doctor_name}
          onChange={handleChange}
          placeholder="Dr. Adams"
        />
        <InputField
          label="Department (optional)"
          name="department"
          value={formState.department}
          onChange={handleChange}
          placeholder="Cardiology"
        />
      </div>
      <TextAreaField
        label="Notes (optional)"
        name="notes"
        value={formState.notes}
        onChange={handleChange}
        placeholder="Add patient prep instructions or key reminders…"
      />
      <Button type="submit" className="w-full justify-center py-3" isLoading={isSubmitting}>
        {isSubmitting ? "Scheduling..." : "Schedule appointment"}
      </Button>
    </form>
  );
};
