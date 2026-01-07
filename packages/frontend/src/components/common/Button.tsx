import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
};

export const Button = ({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) => {
  const variants = {
    primary: cn(
      "bg-accent text-white",
      "hover:bg-accent-dark",
      "focus:ring-accent/30",
      "shadow-sm hover:shadow-md"
    ),
    secondary: cn(
      "bg-stone-100 text-stone-700",
      "hover:bg-stone-200",
      "focus:ring-stone-300"
    ),
    danger: cn(
      "bg-red-500 text-white",
      "hover:bg-red-600",
      "focus:ring-red-300",
      "shadow-sm"
    ),
    ghost: cn(
      "bg-transparent text-stone-600",
      "hover:bg-stone-100 hover:text-stone-900",
      "focus:ring-stone-300"
    ),
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  return (
    <button
      className={cn(
        "btn",
        "inline-flex items-center justify-center font-medium rounded-xl",
        "transition-all duration-200 ease-out",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};
