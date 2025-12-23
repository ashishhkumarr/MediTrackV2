import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Appointment, createAppointment, fetchAppointments } from "../services/appointments";

export const useAppointments = () => {
  return useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: fetchAppointments
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    }
  });
};
