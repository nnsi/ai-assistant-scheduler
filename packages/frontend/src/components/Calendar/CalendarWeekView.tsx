import { useMemo } from "react";
import {
  getWeekDays,
  getWeekDayLabels,
  isSameDay,
  formatDate,
  formatDateString,
  parseISO,
  getHours,
  getMinutes,
} from "@/lib/date";
import { cn } from "@/lib/cn";
import type { Schedule } from "@ai-scheduler/shared";

type CalendarWeekViewProps = {
  currentDate: Date;
  schedules: Schedule[];
  onTimeSlotClick: (date: Date, hour: number) => void;
  onScheduleClick: (schedule: Schedule) => void;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const CalendarWeekView = ({
  currentDate,
  schedules,
  onTimeSlotClick,
  onScheduleClick,
}: CalendarWeekViewProps) => {
  const days = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const weekDayLabels = getWeekDayLabels();
  const today = new Date();

  // 日付ごとのスケジュールをマッピング
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    schedules.forEach((schedule) => {
      const dateKey = schedule.startAt.split("T")[0];
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, schedule]);
    });
    return map;
  }, [schedules]);

  const getSchedulesForDate = (date: Date): Schedule[] => {
    const dateKey = formatDate(date, "yyyy-MM-dd");
    return schedulesByDate.get(dateKey) || [];
  };

  const getSchedulePosition = (schedule: Schedule) => {
    const date = parseISO(schedule.startAt);
    const hour = getHours(date);
    const minutes = getMinutes(date);
    return { hour, topOffset: (minutes / 60) * 100 };
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-stone-200/50 overflow-hidden flex-1 flex flex-col min-h-0">
      {/* 全体をスクロールコンテナに */}
      <div className="overflow-y-auto flex-1">
        {/* ヘッダー + 終日エリア - 1つのstickyコンテナ */}
        <div className="sticky top-0 z-20 bg-stone-50 border-b border-stone-200">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-[50px_repeat(7,1fr)] sm:grid-cols-[60px_repeat(7,1fr)]">
            <div className="py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-stone-500">
              時間
            </div>
            {days.map((date, index) => {
              const isToday = isSameDay(date, today);
              const isSunday = index === 0;
              const isSaturday = index === 6;

              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "py-1.5 sm:py-2 text-center border-l border-stone-100",
                    isToday && "bg-accent-light/30"
                  )}
                >
                  <div
                    className={cn(
                      "text-[10px] sm:text-xs font-medium",
                      isSunday && "text-rose-500",
                      isSaturday && "text-sky-500",
                      !isSunday && !isSaturday && "text-stone-600"
                    )}
                  >
                    {weekDayLabels[index]}
                  </div>
                  <div
                    className={cn(
                      "text-xs sm:text-sm font-medium mt-0.5",
                      isToday
                        ? "bg-accent text-white rounded-full w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center mx-auto text-[10px] sm:text-sm"
                        : "text-stone-900"
                    )}
                  >
                    {formatDate(date, "d")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 終日イベントエリア */}
          <div className="grid grid-cols-[50px_repeat(7,1fr)] sm:grid-cols-[60px_repeat(7,1fr)] border-t border-stone-100">
            <div className="py-1 sm:py-1.5 text-center text-[10px] sm:text-xs text-stone-500 font-medium">終日</div>
            {days.map((date) => {
              const daySchedules = getSchedulesForDate(date).filter(
                (s) => s.isAllDay
              );
              return (
                <div
                  key={date.toISOString()}
                  className="py-0.5 px-0.5 sm:py-1 sm:px-1 border-l border-stone-100 min-h-[24px] sm:min-h-[28px] overflow-hidden"
                >
                  {daySchedules.map((schedule) => {
                    const categoryColor = schedule.category?.color;
                    return (
                      <button
                        key={schedule.id}
                        onClick={() => onScheduleClick(schedule)}
                        className={cn(
                          "w-full text-left text-[10px] sm:text-xs rounded sm:rounded-lg px-1 sm:px-2 py-0.5 truncate block",
                          "font-medium transition-all duration-200",
                          !categoryColor && "bg-accent/10 text-accent-dark hover:bg-accent/20"
                        )}
                        style={categoryColor ? {
                          backgroundColor: `${categoryColor}20`,
                          color: categoryColor,
                        } : undefined}
                      >
                        {schedule.title}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* 時間グリッド */}
        <div className="grid grid-cols-[50px_repeat(7,1fr)] sm:grid-cols-[60px_repeat(7,1fr)]">
          {/* 時間列 */}
          <div>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-10 sm:h-12 border-b border-stone-100 text-right pr-1 sm:pr-3 text-[10px] sm:text-xs text-stone-400 font-medium"
              >
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* 日ごとの列 */}
          {days.map((date) => {
            const daySchedules = getSchedulesForDate(date).filter(
              (s) => !s.isAllDay
            );

            return (
              <div key={date.toISOString()} className="relative border-l border-stone-100">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="h-10 sm:h-12 border-b border-stone-100 hover:bg-stone-50 cursor-pointer transition-colors"
                    onClick={() => onTimeSlotClick(date, hour)}
                  />
                ))}

                {/* スケジュール表示 */}
                {daySchedules.map((schedule) => {
                  const { hour, topOffset } = getSchedulePosition(schedule);
                  const categoryColor = schedule.category?.color;
                  return (
                    <button
                      key={schedule.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onScheduleClick(schedule);
                      }}
                      className={cn(
                        "absolute left-px right-px sm:left-0.5 sm:right-0.5 rounded sm:rounded-lg px-0.5 sm:px-1.5 py-0.5 sm:py-1 truncate text-left",
                        "text-[10px] sm:text-xs font-medium transition-all duration-200",
                        "shadow-sm hover:shadow-md hover:scale-[1.02]",
                        !categoryColor && "bg-accent text-white"
                      )}
                      style={{
                        top: `calc(${hour * 40}px + ${topOffset * 0.4}px)`,
                        minHeight: "18px",
                        ...(categoryColor ? { backgroundColor: categoryColor, color: "white" } : {}),
                      }}
                    >
                      <span className="opacity-80 hidden sm:inline">
                        {formatDateString(schedule.startAt, "HH:mm")}
                      </span>
                      <span className="sm:ml-1">{schedule.title}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
