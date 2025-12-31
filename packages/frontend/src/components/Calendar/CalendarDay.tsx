import { cn } from "@/lib/cn";
import type { Schedule } from "@ai-scheduler/shared";

type CalendarDayProps = {
  date: Date;
  schedules: Schedule[];
  isToday: boolean;
  isCurrentMonth: boolean;
  onClick: () => void;
  onScheduleClick: (schedule: Schedule) => void;
};

export const CalendarDay = ({
  date,
  schedules,
  isToday,
  isCurrentMonth,
  onClick,
  onScheduleClick,
}: CalendarDayProps) => {
  return (
    <div
      data-testid="calendar-day"
      onClick={onClick}
      className={cn(
        "min-h-24 p-2 border-b border-r cursor-pointer hover:bg-gray-50 transition-colors",
        !isCurrentMonth && "bg-gray-50 text-gray-400",
        isToday && "bg-blue-50"
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center w-7 h-7 text-sm",
          isToday && "bg-primary-600 text-white rounded-full"
        )}
      >
        {date.getDate()}
      </span>

      <div className="mt-1 space-y-1">
        {schedules.slice(0, 3).map((schedule) => (
          <div
            key={schedule.id}
            onClick={(e) => {
              e.stopPropagation();
              onScheduleClick(schedule);
            }}
            className={cn(
              "text-xs px-2 py-1 rounded truncate cursor-pointer transition-colors",
              "bg-primary-100 text-primary-700 hover:bg-primary-200"
            )}
          >
            {schedule.title}
          </div>
        ))}
        {schedules.length > 3 && (
          <div className="text-xs text-gray-500 px-2">
            +{schedules.length - 3}件
          </div>
        )}
      </div>
    </div>
  );
};
