import { useMemo } from "react";
import {
  formatDate,
  formatDateString,
  isSameDay,
  parseISO,
  getHours,
  getMinutes,
} from "@/lib/date";
import { cn } from "@/lib/cn";
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
    const startDate = parseISO(schedule.startAt);
    const hour = getHours(startDate);
    const minutes = getMinutes(startDate);
    const topOffset = (minutes / 60) * 100;

    // 終了時間からブロックの高さを計算
    let heightMinutes = 60; // デフォルト1時間
    if (schedule.endAt) {
      const endDate = parseISO(schedule.endAt);
      const startTotal = getHours(startDate) * 60 + getMinutes(startDate);
      const endTotal = getHours(endDate) * 60 + getMinutes(endDate);
      heightMinutes = Math.max(30, endTotal - startTotal); // 最低30分
    }

    return { hour, topOffset, heightMinutes };
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-stone-200/50 overflow-hidden flex-1 flex flex-col min-h-0">
      {/* ヘッダー */}
      <div className={cn(
        "border-b border-stone-100 px-5 py-4 sticky top-0 z-10",
        isToday ? "bg-accent-light/30" : "bg-stone-50/80"
      )}>
        <div className="text-center">
          <div className={cn(
            "text-xl font-display",
            isToday ? "text-accent-dark" : "text-stone-900"
          )}>
            {formatDate(currentDate, "yyyy年M月d日")}
          </div>
          <div className="text-sm text-stone-500 mt-0.5">
            {formatDate(currentDate, "EEEE")}
          </div>
        </div>
      </div>

      {/* 終日イベントエリア */}
      {allDaySchedules.length > 0 && (
        <div className="border-b border-stone-100 bg-stone-50/50 px-5 py-3">
          <div className="text-xs text-stone-500 font-medium mb-2">終日</div>
          <div className="space-y-1.5">
            {allDaySchedules.map((schedule) => {
              const categoryColor = schedule.category?.color;
              return (
                <button
                  key={schedule.id}
                  onClick={() => onScheduleClick(schedule)}
                  className={cn(
                    "w-full text-left rounded-xl px-4 py-2.5",
                    "font-medium transition-all duration-200",
                    !categoryColor && "bg-accent/10 text-accent-dark hover:bg-accent/20 hover:shadow-sm"
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
        </div>
      )}

      {/* 時間グリッド */}
      <div className="overflow-y-auto flex-1">
        <div className="grid grid-cols-[70px_1fr]">
          {/* 時間列 */}
          <div>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b border-stone-100 text-right pr-4 text-xs text-stone-400 font-medium pt-1"
              >
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* スケジュール表示エリア */}
          <div className="relative border-l border-stone-100">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b border-stone-100 hover:bg-stone-50 cursor-pointer transition-colors"
                onClick={() => onTimeSlotClick(currentDate, hour)}
              />
            ))}

            {/* スケジュール表示 */}
            {timedSchedules.map((schedule) => {
              const { hour, topOffset, heightMinutes } = getSchedulePosition(schedule);
              const categoryColor = schedule.category?.color;
              // パーセンテージベースで位置と高さを計算（親要素の実際の高さに依存）
              const topPercent = ((hour * 60 + (topOffset / 100) * 60) / (24 * 60)) * 100;
              const heightPercent = (heightMinutes / (24 * 60)) * 100;
              return (
                <button
                  key={schedule.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onScheduleClick(schedule);
                  }}
                  className={cn(
                    "absolute left-2 right-2 rounded-xl px-4 py-2 text-left overflow-hidden",
                    "font-medium transition-all duration-200",
                    "shadow-sm hover:shadow-md hover:scale-[1.01]",
                    !categoryColor && "bg-accent text-white"
                  )}
                  style={{
                    top: `${topPercent}%`,
                    height: `${Math.max(2.5, heightPercent)}%`,
                    minHeight: "32px",
                    ...(categoryColor ? { backgroundColor: categoryColor, color: "white" } : {}),
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="opacity-80 text-sm">
                      {formatDateString(schedule.startAt, "HH:mm")}
                      {schedule.endAt && ` - ${formatDateString(schedule.endAt, "HH:mm")}`}
                    </span>
                  </div>
                  <div className="truncate">{schedule.title}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
