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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-gray-50 border-b sticky top-0 z-10">
        <div className="py-2 text-center text-xs font-medium text-gray-500">
          時間
        </div>
        {days.map((date, index) => (
          <div
            key={date.toISOString()}
            className={`py-2 text-center border-l ${
              isSameDay(date, today) ? "bg-blue-50" : ""
            }`}
          >
            <div
              className={`text-xs font-medium ${
                index === 0
                  ? "text-red-500"
                  : index === 6
                  ? "text-blue-500"
                  : "text-gray-700"
              }`}
            >
              {weekDayLabels[index]}
            </div>
            <div
              className={`text-sm ${
                isSameDay(date, today)
                  ? "bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto"
                  : "text-gray-900"
              }`}
            >
              {formatDate(date, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* 終日イベントエリア */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-gray-50">
        <div className="py-1 text-center text-xs text-gray-500">終日</div>
        {days.map((date) => {
          const daySchedules = getSchedulesForDate(date).filter(
            (s) => s.isAllDay
          );
          return (
            <div
              key={date.toISOString()}
              className="py-1 px-1 border-l min-h-[28px]"
            >
              {daySchedules.map((schedule) => (
                <button
                  key={schedule.id}
                  onClick={() => onScheduleClick(schedule)}
                  className="w-full text-left text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 truncate hover:bg-blue-200 transition-colors"
                >
                  {schedule.title}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* 時間グリッド */}
      <div className="overflow-y-auto max-h-[600px]">
        <div className="grid grid-cols-[60px_repeat(7,1fr)]">
          {/* 時間列 */}
          <div>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-12 border-b text-right pr-2 text-xs text-gray-500"
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
              <div key={date.toISOString()} className="relative border-l">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="h-12 border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => onTimeSlotClick(date, hour)}
                  />
                ))}

                {/* スケジュール表示 */}
                {daySchedules.map((schedule) => {
                  const { hour, topOffset } = getSchedulePosition(schedule);
                  return (
                    <button
                      key={schedule.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onScheduleClick(schedule);
                      }}
                      className="absolute left-0.5 right-0.5 bg-blue-500 text-white text-xs rounded px-1 py-0.5 truncate hover:bg-blue-600 transition-colors shadow-sm"
                      style={{
                        top: `calc(${hour * 48}px + ${topOffset * 0.48}px)`,
                        minHeight: "20px",
                      }}
                    >
                      <span className="font-medium">
                        {formatDateString(schedule.startAt, "HH:mm")}
                      </span>
                      <span className="ml-1">{schedule.title}</span>
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
