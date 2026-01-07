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
  const dayOfWeek = date.getDay();
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;

  return (
    <div
      data-testid="calendar-day"
      onClick={onClick}
      className={cn(
        "min-h-20 sm:min-h-28 p-0.5 sm:p-2 border-b border-r border-stone-100",
        "cursor-pointer transition-colors duration-200",
        "hover:bg-stone-50",
        !isCurrentMonth && "bg-stone-50/50",
        isToday && "bg-accent-light/30"
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7 text-[10px] sm:text-sm font-medium rounded-full ml-0.5 sm:ml-0",
          "transition-colors duration-200",
          isToday && "bg-accent text-white shadow-sm",
          !isToday && !isCurrentMonth && "text-stone-400",
          !isToday && isCurrentMonth && isSunday && "text-rose-500",
          !isToday && isCurrentMonth && isSaturday && "text-sky-500",
          !isToday && isCurrentMonth && !isSunday && !isSaturday && "text-stone-700"
        )}
      >
        {date.getDate()}
      </span>

      <div className="mt-0.5 sm:mt-1.5 space-y-0.5 sm:space-y-1">
        {schedules.slice(0, 3).map((schedule) => {
          const categoryColor = schedule.category?.color;
          return (
            <button
              key={schedule.id}
              onClick={(e) => {
                e.stopPropagation();
                onScheduleClick(schedule);
              }}
              className={cn(
                "w-full text-left text-[10px] sm:text-xs px-0.5 sm:px-2 py-0.5 sm:py-1 rounded sm:rounded-lg truncate",
                "font-medium transition-all duration-200",
                "hover:scale-[1.02]",
                !categoryColor && "bg-accent/10 text-accent-dark hover:bg-accent/20"
              )}
              style={categoryColor ? {
                backgroundColor: `${categoryColor}20`,
                color: categoryColor,
              } : undefined}
              onMouseEnter={(e) => {
                if (categoryColor) {
                  e.currentTarget.style.backgroundColor = `${categoryColor}35`;
                }
              }}
              onMouseLeave={(e) => {
                if (categoryColor) {
                  e.currentTarget.style.backgroundColor = `${categoryColor}20`;
                }
              }}
            >
              {schedule.title}
            </button>
          );
        })}
        {schedules.length > 3 && (
          <div className="text-[10px] sm:text-xs text-stone-500 px-0.5 font-medium">
            +{schedules.length - 3}件
          </div>
        )}
      </div>
    </div>
  );
};
