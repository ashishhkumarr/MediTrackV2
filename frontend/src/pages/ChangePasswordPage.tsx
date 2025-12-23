import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

import { ErrorState } from "../components/ErrorState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SectionHeader } from "../components/ui/SectionHeader";
import { changePassword, fetchCurrentUser } from "../services/users";
import { useQuery } from "@tanstack/react-query";

type FieldKey = "old_password" | "new_password" | "confirm_new_password";

const ChangePasswordPage = () => {
  const { isLoading, error } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser
  });
  const [formState, setFormState] = useState({
    old_password: "",
    new_password: "",
    confirm_new_password: ""
  });
  const [errors, setErrors] = useState<Record<FieldKey, string>>({
    old_password: "",
    new_password: "",
    confirm_new_password: ""
  });
  const [show, setShow] = useState<Record<FieldKey, boolean>>({
    old_password: false,
    new_password: false,
    confirm_new_password: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Unable to load account context." />;

  const toggleVisibility = (field: FieldKey) => {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const nextErrors: Record<FieldKey, string> = {
      old_password: "",
      new_password: "",
      confirm_new_password: ""
    };
    if (!formState.old_password) nextErrors.old_password = "Required";
    if (!formState.new_password) {
      nextErrors.new_password = "Required";
    } else if (formState.new_password.length < 8) {
      nextErrors.new_password = "Must be at least 8 characters";
    }
    if (formState.new_password !== formState.confirm_new_password) {
      nextErrors.confirm_new_password = "Passwords must match";
    }
    setErrors(nextErrors);
    return Object.values(nextErrors).every((val) => !val);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiError(null);
    setSuccess(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await changePassword(formState);
      setSuccess("Password updated successfully.");
      setFormState({
        old_password: "",
        new_password: "",
        confirm_new_password: ""
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        "Unable to update password. Please try again.";
      setApiError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderPasswordField = (
    label: string,
    name: FieldKey,
    value: string,
    errorMessage?: string
  ) => (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {label}
      <div className="relative">
        <input
          type={show[name] ? "text" : "password"}
          name={name}
          value={value}
          onChange={handleChange}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-brand"
          onClick={() => toggleVisibility(name)}
        >
          {show[name] ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>
      {errorMessage && <span className="text-xs text-accent-rose">{errorMessage}</span>}
    </label>
  );

  return (
    <Card className="animate-fadeIn">
      <SectionHeader
        title="Change password"
        description="Set a new password after verifying your current one."
      />
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {renderPasswordField("Current password", "old_password", formState.old_password, errors.old_password)}
        {renderPasswordField("New password", "new_password", formState.new_password, errors.new_password)}
        {renderPasswordField(
          "Confirm new password",
          "confirm_new_password",
          formState.confirm_new_password,
          errors.confirm_new_password
        )}
        {apiError && (
          <div className="rounded-2xl bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose">{apiError}</div>
        )}
        {success && <div className="rounded-2xl bg-accent-emerald/10 px-4 py-3 text-sm text-accent-emerald">{success}</div>}
        <Button type="submit" className="w-full justify-center py-3" isLoading={submitting}>
          {submitting ? "Updating..." : "Change Password"}
        </Button>
      </form>
    </Card>
  );
};

export default ChangePasswordPage;
