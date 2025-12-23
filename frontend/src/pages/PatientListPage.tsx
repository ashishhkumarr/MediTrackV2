import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";

import { ErrorState } from "../components/ErrorState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { InputField, TextAreaField } from "../components/ui/FormField";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useCreatePatient, usePatients } from "../hooks/usePatients";
import { PatientCreatePayload } from "../services/patients";

type PatientFormState = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  sex: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

const initialFormState: PatientFormState = {
  first_name: "",
  last_name: "",
  date_of_birth: "",
  sex: "",
  email: "",
  phone: "",
  address: "",
  notes: ""
};

const PatientListPage = () => {
  const { data, isLoading, error } = usePatients();
  const createPatient = useCreatePatient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<PatientFormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof PatientFormState, string>>
  >({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!isModalOpen) return;
    document.body.classList.add("overflow-hidden");
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isModalOpen]);

  const { filteredPatients, totalCount, hasSearch } = useMemo(() => {
    const patients = data ?? [];
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed) {
      return { filteredPatients: patients, totalCount: patients.length, hasSearch: false };
    }

    const filtered = patients.filter((patient) => {
      const name = patient.full_name?.toLowerCase() ?? "";
      const email = patient.email?.toLowerCase() ?? "";
      const phone = patient.phone?.toLowerCase() ?? "";
      return name.includes(trimmed) || email.includes(trimmed) || phone.includes(trimmed);
    });

    return { filteredPatients: filtered, totalCount: patients.length, hasSearch: true };
  }, [data, searchTerm]);

  if (isLoading) return <LoadingSpinner />;
  if (error)
    return (
      <ErrorState message="We couldn't load patient records. Please check your connection and try again." />
    );

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setApiError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setApiError(null);
    setFormErrors({});
    setFormState(initialFormState);
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof PatientFormState, string>> = {};

    if (!formState.first_name.trim()) {
      nextErrors.first_name = "Required";
    }
    if (!formState.last_name.trim()) {
      nextErrors.last_name = "Required";
    }
    if (formState.email.trim()) {
      const emailPattern = /^\S+@\S+\.\S+$/;
      if (!emailPattern.test(formState.email.trim())) {
        nextErrors.email = "Enter a valid email";
      }
    }
    if (formState.date_of_birth.trim()) {
      const parsed = Date.parse(formState.date_of_birth);
      if (Number.isNaN(parsed)) {
        nextErrors.date_of_birth = "Enter a valid date";
      }
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getApiErrorMessage = (error: any) => {
    const detail = error?.response?.data?.detail;
    if (Array.isArray(detail)) {
      const first = detail[0];
      if (typeof first === "string") {
        return detail.join(" ");
      }
      if (first?.msg) {
        return first.msg;
      }
    }
    if (typeof detail === "string") {
      return detail;
    }
    return "We couldn't create the patient record. Please review the form and try again.";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);
    if (!validate()) return;

    const payload: PatientCreatePayload = {
      first_name: formState.first_name.trim(),
      last_name: formState.last_name.trim(),
      date_of_birth: formState.date_of_birth || undefined,
      sex: formState.sex || undefined,
      email: formState.email.trim() || undefined,
      phone: formState.phone.trim() || undefined,
      address: formState.address.trim() || undefined,
      notes: formState.notes.trim() || undefined
    };

    try {
      await createPatient.mutateAsync(payload);
      setSuccessMessage("Patient created successfully");
      handleCloseModal();
    } catch (submitError: any) {
      setApiError(getApiErrorMessage(submitError));
    }
  };

  return (
    <Card className="animate-fadeIn space-y-5">
      <SectionHeader
        title="Patients directory"
        description="Review every active patient profile and contact detail."
        action={
          <Button onClick={handleOpenModal} className="shadow-card">
            New Patient
          </Button>
        }
      />
      {successMessage && (
        <div className="rounded-2xl border border-accent-emerald/30 bg-accent-emerald/10 px-4 py-3 text-sm text-accent-emerald">
          {successMessage}
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="w-full max-w-md">
          <InputField
            label="Search patients"
            placeholder="Search by name, email, or phone"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <p className="text-sm text-slate-500">
          {hasSearch
            ? `Showing ${filteredPatients.length} of ${totalCount} patients`
            : `${totalCount} patients`}
        </p>
      </div>

      {!totalCount && (
        <p className="rounded-2xl bg-surface-subtle px-4 py-6 text-center text-sm text-slate-500">
          No patient records yet. Create your first appointment or add a patient to get started.
        </p>
      )}

      {!!totalCount && !filteredPatients.length && (
        <p className="rounded-2xl bg-surface-subtle px-4 py-6 text-center text-sm text-slate-500">
          No patients match "{searchTerm.trim()}". Try a different name, email, or phone.
        </p>
      )}

      {!!filteredPatients.length && (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full text-left text-sm text-slate-600">
            <thead className="bg-surface-subtle text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Date of Birth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="cursor-pointer transition hover:bg-slate-50"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/patients/${patient.id}`}
                      className="font-medium text-brand hover:text-brand-dark"
                    >
                      {patient.full_name}
                    </Link>
                    <p className="text-xs text-slate-400">ID #{patient.id}</p>
                  </td>
                  <td className="px-4 py-3">{patient.email || "—"}</td>
                  <td className="px-4 py-3">{patient.phone || "—"}</td>
                  <td className="px-4 py-3">{patient.date_of_birth || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-6">
            <div className="absolute inset-0" onClick={handleCloseModal} />
            <div className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-card max-h-[90vh]">
              <div className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-white/95 px-6 pb-4 pt-5 backdrop-blur">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">New patient</h3>
                  <p className="text-sm text-slate-500">
                    Capture patient demographics and contact details.
                  </p>
                </div>
                <Button variant="ghost" type="button" onClick={handleCloseModal}>
                  Close
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField
                      label="First name"
                      name="first_name"
                      value={formState.first_name}
                      onChange={handleChange}
                      error={formErrors.first_name}
                      required
                    />
                    <InputField
                      label="Last name"
                      name="last_name"
                      value={formState.last_name}
                      onChange={handleChange}
                      error={formErrors.last_name}
                      required
                    />
                    <InputField
                      label="Date of birth (optional)"
                      type="date"
                      name="date_of_birth"
                      value={formState.date_of_birth}
                      onChange={handleChange}
                      error={formErrors.date_of_birth}
                    />
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Sex (optional)
                      <select
                        name="sex"
                        value={formState.sex}
                        onChange={handleChange}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition-all duration-200 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                      >
                        <option value="">Select</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </label>
                    <InputField
                      label="Email (optional)"
                      type="email"
                      name="email"
                      value={formState.email}
                      onChange={handleChange}
                      error={formErrors.email}
                    />
                    <InputField
                      label="Phone (optional)"
                      name="phone"
                      value={formState.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <TextAreaField
                    label="Address (optional)"
                    name="address"
                    value={formState.address}
                    onChange={handleChange}
                    placeholder="Street, city, state, ZIP"
                  />
                  <TextAreaField
                    label="Notes (optional)"
                    name="notes"
                    value={formState.notes}
                    onChange={handleChange}
                    placeholder="Add relevant clinical context or preferences."
                  />
                  {apiError && <ErrorState message={apiError} />}
                </div>
                <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
                  <Button variant="secondary" type="button" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={createPatient.isPending}
                    disabled={createPatient.isPending}
                  >
                    {createPatient.isPending ? "Saving..." : "Create patient"}
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </Card>
  );
};

export default PatientListPage;
