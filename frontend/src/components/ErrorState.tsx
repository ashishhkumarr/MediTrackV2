import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface Props {
  message?: string;
}

export const ErrorState = ({ message }: Props) => (
  <div className="flex items-center gap-3 rounded-2xl border border-accent-rose/30 bg-accent-rose/5 px-4 py-3 text-sm text-accent-rose">
    <ExclamationTriangleIcon className="h-4 w-4" />
    {message || "Something went wrong. Please try again."}
  </div>
);
