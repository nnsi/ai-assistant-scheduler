import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "w-full px-4 py-3 rounded-xl border bg-white",
          "text-stone-800 placeholder:text-stone-400",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
          error ? "border-red-300" : "border-stone-200",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
