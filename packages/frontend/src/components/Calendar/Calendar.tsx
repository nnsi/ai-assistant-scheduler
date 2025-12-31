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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`py-2 text-center text-sm font-medium ${
              index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-gray-700"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div role="grid" className="grid grid-cols-7">
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
