import { useMemo } from "react";
import { CalendarDay } from "./CalendarDay";
import {
  getCalendarDays,
  getWeekDayLabels,
  isSameMonth,
  isSameDay,
  formatDate,
} from "@/lib/date";
import type { Schedule } from "@ai-scheduler/shared";

type CalendarProps = {
  currentMonth: Date;
  schedules: Schedule[];
  onDateClick: (date: Date) => void;
  onScheduleClick: (schedule: Schedule) => void;
};

export const Calendar = ({
  currentMonth,
  schedules,
  onDateClick,
  onScheduleClick,
}: CalendarProps) => {
  const days = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);
  const weekDays = getWeekDayLabels();
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

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-stone-200/50 overflow-hidden flex-1 flex flex-col min-h-0">
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 bg-stone-50/80 border-b border-stone-100">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`py-2 sm:py-3 text-center text-xs sm:text-sm font-medium ${
              index === 0
                ? "text-rose-500"
                : index === 6
                ? "text-sky-500"
                : "text-stone-600"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div role="grid" className="grid grid-cols-7 flex-1 overflow-y-auto">
        {days.map((date) => (
          <CalendarDay
            key={date.toISOString()}
            date={date}
            schedules={getSchedulesForDate(date)}
            isToday={isSameDay(date, today)}
            isCurrentMonth={isSameMonth(date, currentMonth)}
            onClick={() => onDateClick(date)}
            onScheduleClick={onScheduleClick}
          />
        ))}
      </div>
    </div>
  );
};
