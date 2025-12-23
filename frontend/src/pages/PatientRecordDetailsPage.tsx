import { useParams } from "react-router-dom";

import { ErrorState } from "../components/ErrorState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Card } from "../components/ui/Card";
import { SectionHeader } from "../components/ui/SectionHeader";
import { usePatient } from "../hooks/usePatients";

const PatientRecordDetailsPage = () => {
  const { id } = useParams();
  const patientId = Number(id);
  const { data, isLoading, error } = usePatient(patientId);

  if (isLoading) return <LoadingSpinner />;
  if (error || !data) return <ErrorState message="Patient not found." />;

  const details = [
    { label: "Email", value: data.email },
    { label: "Phone", value: data.phone },
    { label: "Medical History", value: data.medical_history },
    { label: "Medications", value: data.medications },
    { label: "Notes", value: data.notes }
  ];

  return (
    <Card className="animate-fadeIn">
      <SectionHeader title={data.full_name} description="Patient profile and clinical notes." />
      <div className="grid gap-5 md:grid-cols-2">
        {details.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-100 bg-surface-subtle px-4 py-3"
          >
            <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
            <p className="mt-1 text-sm text-slate-700">{item.value || "—"}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PatientRecordDetailsPage;
