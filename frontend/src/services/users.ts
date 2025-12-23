import { apiClient } from "./api";
import { AuthUser } from "../context/AuthContext";

export const fetchCurrentUser = async (): Promise<AuthUser> => {
  const { data } = await apiClient.get<AuthUser>("/users/me");
  return data;
};

export const updateCurrentUser = async (payload: {
  full_name?: string;
  phone?: string;
  password?: string;
}): Promise<AuthUser> => {
  const { data } = await apiClient.put<AuthUser>("/users/me", payload);
  return data;
};

export const changePassword = async (payload: {
  old_password: string;
  new_password: string;
  confirm_new_password: string;
}) => {
  const { data } = await apiClient.post("/users/change-password", payload);
  return data;
};
