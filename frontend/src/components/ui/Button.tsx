import clsx from "classnames";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

const baseStyles =
  "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-sm hover:bg-brand-dark focus-visible:ring-brand",
  secondary:
    "bg-white text-brand border border-brand/20 hover:border-brand/40 hover:bg-brand/5 focus-visible:ring-brand",
  ghost:
    "text-slate-600 hover:text-brand hover:bg-slate-100 focus-visible:ring-slate-200"
};

export const Button = ({
  children,
  className,
  variant = "primary",
  isLoading,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={clsx(
        baseStyles,
        variantStyles[variant],
        "px-4 py-2",
        "hover:scale-[1.01]",
        className
      )}
      {...props}
    >
      {isLoading ? "Processing..." : children}
    </button>
  );
};
