interface CalendarColorDotProps {
  color: string;
  size?: "sm" | "md" | "lg";
}

export const CalendarColorDot = ({ color, size = "sm" }: CalendarColorDotProps) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <span
      className={`${sizeClasses[size]} rounded-full inline-block flex-shrink-0`}
      style={{ backgroundColor: color }}
    />
  );
};
