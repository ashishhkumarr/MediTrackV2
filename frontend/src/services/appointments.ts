import { apiClient } from "./api";
import type { Patient } from "./patients";

export type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled";

export interface Appointment {
  id: number;
  patient_id: number;
  patient?: Patient;
  doctor_name: string;
  department?: string;
  appointment_datetime: string;
  status: AppointmentStatus;
  notes?: string;
}

export const fetchAppointments = async (): Promise<Appointment[]> => {
  const { data } = await apiClient.get<Appointment[]>("/appointments/");
  return data;
};

export const createAppointment = async (payload: Partial<Appointment>) => {
  const { data } = await apiClient.post<Appointment>("/appointments/", payload);
  return data;
};
