import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Patient, PatientCreatePayload, createPatient, fetchPatient, fetchPatients } from "../services/patients";

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

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PatientCreatePayload) => createPatient(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    }
  });
};
