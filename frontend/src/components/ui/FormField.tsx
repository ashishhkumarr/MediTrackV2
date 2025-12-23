import clsx from "classnames";
import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface BaseFieldProps {
  label: string;
  error?: string;
  hint?: string;
}

type InputFieldProps = BaseFieldProps &
  InputHTMLAttributes<HTMLInputElement | HTMLSelectElement>;

export const InputField = ({
  label,
  className,
  error,
  hint,
  ...props
}: InputFieldProps) => {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        className={clsx(
          "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30",
          error && "border-accent-rose focus:ring-accent-rose/40",
          className
        )}
        {...props}
      />
      {hint && !error && <span className="text-xs text-slate-400">{hint}</span>}
      {error && <span className="text-xs text-accent-rose">{error}</span>}
    </label>
  );
};

type TextAreaProps = BaseFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextAreaField = ({
  label,
  className,
  error,
  hint,
  ...props
}: TextAreaProps) => {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {label}
      <textarea
        className={clsx(
          "min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30",
          error && "border-accent-rose focus:ring-accent-rose/40",
          className
        )}
        {...props}
      />
      {hint && !error && <span className="text-xs text-slate-400">{hint}</span>}
      {error && <span className="text-xs text-accent-rose">{error}</span>}
    </label>
  );
};
