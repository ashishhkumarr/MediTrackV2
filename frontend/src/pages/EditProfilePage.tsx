import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useMutation, useQuery } from "@tanstack/react-query";

import { ErrorState } from "../components/ErrorState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { InputField } from "../components/ui/FormField";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useAuth } from "../hooks/useAuth";
import { fetchCurrentUser, updateCurrentUser } from "../services/users";

const EditProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    initialData: user ?? undefined
  });
  const [formState, setFormState] = useState({
    full_name: data?.full_name ?? "",
    phone: data?.phone ?? ""
  });
  const mutation = useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: (updated) => {
      updateUser(updated);
    }
  });

  useEffect(() => {
    if (data) {
      setFormState({
        full_name: data.full_name ?? "",
        phone: data.phone ?? ""
      });
    }
  }, [data]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Unable to load profile." />;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await mutation.mutateAsync({
      full_name: formState.full_name,
      phone: formState.phone
    });
  };

  return (
    <Card className="animate-fadeIn">
      <SectionHeader
        title="Profile settings"
        description="Maintain accurate information for secure clinic communication."
      />
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <InputField
          label="Full name"
          name="full_name"
          value={formState.full_name}
          onChange={handleChange}
      />
        <InputField label="Phone number" name="phone" value={formState.phone} onChange={handleChange} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" disabled={mutation.isPending} className="w-full justify-center py-3 sm:w-auto">
            {mutation.isPending ? "Saving..." : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-center py-3 sm:w-auto"
            onClick={() => navigate("/change-password")}
          >
            Change Password
          </Button>
        </div>
        {mutation.isSuccess && (
          <p className="text-sm text-accent-emerald">Profile updated successfully.</p>
        )}
      </form>
    </Card>
  );
};

export default EditProfilePage;
