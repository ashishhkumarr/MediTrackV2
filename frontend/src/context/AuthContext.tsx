import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { loginRequest } from "../services/auth";
import { setAuthToken } from "../services/api";

export type UserRole = "admin";

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  role: UserRole;
  phone?: string | null;
  specialty?: string | null;
  license_number?: string | null;
  license_state?: string | null;
  license_country?: string | null;
  npi_number?: string | null;
  taxonomy_code?: string | null;
  clinic_name?: string | null;
  clinic_address?: string | null;
  clinic_city?: string | null;
  clinic_state?: string | null;
  clinic_zip?: string | null;
  clinic_country?: string | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = "meditrack_auth";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    try {
      if (stored) {
        const parsed = JSON.parse(stored) as { token: string; user: AuthUser };
        setToken(parsed.token);
        setUser(parsed.user);
        setAuthToken(parsed.token);
      }
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = (authToken: string | null, authUser: AuthUser | null) => {
    if (authToken && authUser) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token: authToken, user: authUser })
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    setToken(response.access_token);
    setUser(response.user);
    persist(response.access_token, response.user);
    setAuthToken(response.access_token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    persist(null, null);
    setAuthToken(null);
  };

  const updateUser = (updatedUser: AuthUser) => {
    setUser(updatedUser);
    if (token) {
      persist(token, updatedUser);
    }
  };

  const value = useMemo(
    () => ({
      token,
      user,
      hydrated,
      login,
      logout,
      updateUser
    }),
    [token, user, hydrated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
};
