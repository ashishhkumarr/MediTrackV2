import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export const SectionHeader = ({ title, description, action }: SectionHeaderProps) => (
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
    {action}
  </div>
);
