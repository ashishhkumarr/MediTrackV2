import { apiClient } from "./api";
import { AuthUser } from "../context/AuthContext";

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export const loginRequest = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", {
    email,
    password
  });
  return data;
};

export const registerUser = async (payload: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}) => {
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
};

export interface SignupPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialty?: string;
  license_number: string;
  license_state?: string;
  license_country?: string;
  npi_number?: string;
  taxonomy_code?: string;
  clinic_name: string;
  clinic_address: string;
  clinic_city: string;
  clinic_state: string;
  clinic_zip: string;
  clinic_country: string;
  password: string;
  confirm_password: string;
}

export const signupRequest = async (payload: SignupPayload): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>("/auth/signup", payload);
  return data;
};
