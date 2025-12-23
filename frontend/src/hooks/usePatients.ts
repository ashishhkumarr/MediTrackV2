import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Patient,
  PatientCreatePayload,
  PatientNotesUpdatePayload,
  createPatient,
  fetchPatient,
  fetchPatientAppointments,
  fetchPatients,
  updatePatientNotes
} from "../services/patients";

export const usePatients = () => {
  return useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: fetchPatients
  });
};

export const usePatient = (patientId: number) => {
  return useQuery<Patient>({
    queryKey: ["patient", patientId],
    queryFn: () => fetchPatient(patientId),
    enabled: !!patientId
  });
};

export const usePatientAppointments = (patientId: number) => {
  return useQuery({
    queryKey: ["patients", patientId, "appointments"],
    queryFn: () => fetchPatientAppointments(patientId),
    enabled: !!patientId
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PatientCreatePayload) => createPatient(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    }
  });
};

export const useUpdatePatientNotes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      payload
    }: {
      patientId: number;
      payload: PatientNotesUpdatePayload;
    }) => updatePatientNotes(patientId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["patient", variables.patientId] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    }
  });
};
