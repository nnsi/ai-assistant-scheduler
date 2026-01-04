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
        "min-h-16 sm:min-h-24 p-1 sm:p-2 border-b border-r cursor-pointer hover:bg-gray-50 transition-colors",
        !isCurrentMonth && "bg-gray-50 text-gray-400",
        isToday && "bg-blue-50"
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7 text-xs sm:text-sm",
          isToday && "bg-primary-600 text-white rounded-full"
        )}
      >
        {date.getDate()}
      </span>

      <div className="mt-0.5 sm:mt-1 space-y-0.5 sm:space-y-1">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            onClick={(e) => {
              e.stopPropagation();
              onScheduleClick(schedule);
            }}
            className={cn(
              "text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded truncate cursor-pointer transition-colors",
              "bg-primary-100 text-primary-700 hover:bg-primary-200"
            )}
          >
            {schedule.title}
          </div>
        ))}
      </div>
    </div>
  );
};
