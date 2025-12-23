import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { InputField } from "../components/ui/FormField";
import { useAuth } from "../hooks/useAuth";
import { signupRequest } from "../services/auth";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  specialty: string;
  license_number: string;
  license_state: string;
  license_country: string;
  npi_number: string;
  taxonomy_code: string;
  clinic_name: string;
  clinic_address: string;
  clinic_city: string;
  clinic_state: string;
  clinic_zip: string;
  clinic_country: string;
  password: string;
  confirm_password: string;
};

const initialState: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  specialty: "",
  license_number: "",
  license_state: "",
  license_country: "",
  npi_number: "",
  taxonomy_code: "",
  clinic_name: "",
  clinic_address: "",
  clinic_city: "",
  clinic_state: "",
  clinic_zip: "",
  clinic_country: "",
  password: "",
  confirm_password: ""
};

const SignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formState, setFormState] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const requiredFields = [
    "first_name",
    "last_name",
    "email",
    "license_number",
    "clinic_name",
    "clinic_address",
    "clinic_city",
    "clinic_state",
    "clinic_zip",
    "clinic_country",
    "password",
    "confirm_password"
  ];

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    requiredFields.forEach((field) => {
      if (!formState[field as keyof FormState]) {
        nextErrors[field] = "Required";
      }
    });
    if (formState.password && formState.password.length < 8) {
      nextErrors.password = "Must be at least 8 characters";
    }
    if (formState.password !== formState.confirm_password) {
      nextErrors.confirm_password = "Passwords must match";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await signupRequest(formState);
      await login(formState.email, formState.password);
      navigate("/admin");
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        "Unable to create your clinic account. Please try again.";
      setApiError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-surface-subtle via-white to-sky-50 px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.08),_transparent_45%)]" />
      <div className="relative z-10 mx-auto max-w-5xl space-y-6 rounded-3xl border border-white/40 bg-white/80 p-6 shadow-card backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-brand">Clinic onboarding</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">Create your MediTrack account</h1>
            <p className="text-sm text-slate-500">
              Doctors and clinic admins can self-serve access. Patients never sign in.
            </p>
          </div>
          <div className="text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="First name"
              name="first_name"
              value={formState.first_name}
              onChange={handleChange}
              error={errors.first_name}
            />
            <InputField
              label="Last name"
              name="last_name"
              value={formState.last_name}
              onChange={handleChange}
              error={errors.last_name}
            />
            <InputField
              label="Email"
              type="email"
              name="email"
              value={formState.email}
              onChange={handleChange}
              error={errors.email}
            />
            <InputField
              label="Phone (optional)"
              name="phone"
              value={formState.phone}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Specialty (optional)"
              name="specialty"
              value={formState.specialty}
              onChange={handleChange}
              hint="e.g., Cardiology, Pediatrics"
            />
            <InputField
              label="NPI number (optional)"
              name="npi_number"
              value={formState.npi_number}
              onChange={handleChange}
            />
            <InputField
              label="Taxonomy code (optional)"
              name="taxonomy_code"
              value={formState.taxonomy_code}
              onChange={handleChange}
              hint="Provider classification code"
            />
            <InputField
              label="Medical license number"
              name="license_number"
              value={formState.license_number}
              onChange={handleChange}
              error={errors.license_number}
            />
            <InputField
              label="License state (optional)"
              name="license_state"
              value={formState.license_state}
              onChange={handleChange}
            />
            <InputField
              label="License country (optional)"
              name="license_country"
              value={formState.license_country}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Clinic or practice name"
              name="clinic_name"
              value={formState.clinic_name}
              onChange={handleChange}
              error={errors.clinic_name}
            />
            <InputField
              label="Clinic street address"
              name="clinic_address"
              value={formState.clinic_address}
              onChange={handleChange}
              error={errors.clinic_address}
            />
            <InputField
              label="City"
              name="clinic_city"
              value={formState.clinic_city}
              onChange={handleChange}
              error={errors.clinic_city}
            />
            <InputField
              label="State/Province"
              name="clinic_state"
              value={formState.clinic_state}
              onChange={handleChange}
              error={errors.clinic_state}
            />
            <InputField
              label="Postal code"
              name="clinic_zip"
              value={formState.clinic_zip}
              onChange={handleChange}
              error={errors.clinic_zip}
            />
            <InputField
              label="Country"
              name="clinic_country"
              value={formState.clinic_country}
              onChange={handleChange}
              error={errors.clinic_country}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Password"
              type="password"
              name="password"
              autoComplete="new-password"
              value={formState.password}
              onChange={handleChange}
              error={errors.password}
              hint="At least 8 characters."
            />
            <InputField
              label="Confirm password"
              type="password"
              name="confirm_password"
              autoComplete="new-password"
              value={formState.confirm_password}
              onChange={handleChange}
              error={errors.confirm_password}
            />
          </div>

          {apiError && (
            <div className="rounded-2xl bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose">
              {apiError}
            </div>
          )}

          <Button type="submit" className="w-full py-3 text-base" isLoading={submitting}>
            {submitting ? "Creating account..." : "Create clinic account"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
