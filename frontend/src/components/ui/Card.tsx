import clsx from "classnames";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export const Card = ({ className, children, padded = true, ...props }: CardProps) => {
  return (
    <div
      className={clsx(
        "glass-card border border-white/40 backdrop-blur",
        padded && "p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
