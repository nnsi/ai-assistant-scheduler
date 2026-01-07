import { useMemo } from "react";
import {
  formatDate,
  formatDateString,
  isSameDay,
  parseISO,
  getHours,
  getMinutes,
} from "@/lib/date";
import type { Schedule } from "@ai-scheduler/shared";

type CalendarDayViewProps = {
  currentDate: Date;
  schedules: Schedule[];
  onTimeSlotClick: (date: Date, hour: number) => void;
  onScheduleClick: (schedule: Schedule) => void;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const CalendarDayView = ({
  currentDate,
  schedules,
  onTimeSlotClick,
  onScheduleClick,
}: CalendarDayViewProps) => {
  const today = new Date();
  const isToday = isSameDay(currentDate, today);

  // その日のスケジュールのみ抽出
  const daySchedules = useMemo(() => {
    const dateKey = formatDate(currentDate, "yyyy-MM-dd");
    return schedules.filter((s) => s.startAt.startsWith(dateKey));
  }, [currentDate, schedules]);

  const allDaySchedules = daySchedules.filter((s) => s.isAllDay);
  const timedSchedules = daySchedules.filter((s) => !s.isAllDay);

  const getSchedulePosition = (schedule: Schedule) => {
    const date = parseISO(schedule.startAt);
    const hour = getHours(date);
    const minutes = getMinutes(date);
    return { hour, topOffset: (minutes / 60) * 100 };
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gray-50 border-b px-4 py-3 sticky top-0 z-10">
        <div
          className={`text-center ${isToday ? "text-blue-600" : "text-gray-900"}`}
        >
          <div className="text-lg font-semibold">
            {formatDate(currentDate, "yyyy年M月d日")}
          </div>
          <div className="text-sm text-gray-500">
            {formatDate(currentDate, "EEEE")}
          </div>
        </div>
      </div>

      {/* 終日イベントエリア */}
      {allDaySchedules.length > 0 && (
        <div className="border-b bg-gray-50 px-4 py-2">
          <div className="text-xs text-gray-500 mb-1">終日</div>
          <div className="space-y-1">
            {allDaySchedules.map((schedule) => (
              <button
                key={schedule.id}
                onClick={() => onScheduleClick(schedule)}
                className="w-full text-left bg-blue-100 text-blue-800 rounded px-2 py-1 text-sm hover:bg-blue-200 transition-colors"
              >
                {schedule.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 時間グリッド */}
      <div className="overflow-y-auto max-h-[600px]">
        <div className="grid grid-cols-[60px_1fr]">
          {/* 時間列 */}
          <div>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b text-right pr-2 text-xs text-gray-500 pt-1"
              >
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* スケジュール表示エリア */}
          <div className="relative border-l">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => onTimeSlotClick(currentDate, hour)}
              />
            ))}

            {/* スケジュール表示 */}
            {timedSchedules.map((schedule) => {
              const { hour, topOffset } = getSchedulePosition(schedule);
              return (
                <button
                  key={schedule.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onScheduleClick(schedule);
                  }}
                  className="absolute left-1 right-1 bg-blue-500 text-white text-sm rounded px-2 py-1 hover:bg-blue-600 transition-colors shadow-sm text-left"
                  style={{
                    top: `calc(${hour * 64}px + ${topOffset * 0.64}px)`,
                    minHeight: "28px",
                  }}
                >
                  <div className="font-medium">
                    {formatDateString(schedule.startAt, "HH:mm")} -{" "}
                    {schedule.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
