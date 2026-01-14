import { cn } from "@/lib/cn";
import {
  formatDate,
  formatDateString,
  getHours,
  getMinutes,
  isSameDay,
  parseISO,
} from "@/lib/date";
import type { Schedule } from "@ai-scheduler/shared";
import { useMemo } from "react";

type CalendarDayViewProps = {
  currentDate: Date;
  schedules: Schedule[];
  onTimeSlotClick: (date: Date, hour: number) => void;
  onScheduleClick: (schedule: Schedule) => void;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

// 指定した日付にスケジュールが表示されるべきか判定
const isScheduleOnDate = (schedule: Schedule, date: Date): boolean => {
  const dateKey = formatDate(date, "yyyy-MM-dd");
  const startDateKey = schedule.startAt.split("T")[0];
  const endDateKey = schedule.endAt?.split("T")[0] || startDateKey;
  return dateKey >= startDateKey && dateKey <= endDateKey;
};

// 予定の重なりを計算して列配置を決定
type ScheduleWithLayout = {
  schedule: Schedule;
  startMinutes: number;
  endMinutes: number;
  column: number;
  totalColumns: number;
};

const calculateOverlapLayout = (
  schedules: Schedule[],
  getPosition: (s: Schedule) => { hour: number; topOffset: number; heightMinutes: number }
): ScheduleWithLayout[] => {
  if (schedules.length === 0) return [];

  // 各予定の開始・終了分を計算
  const schedulesWithTime = schedules.map((schedule) => {
    const { hour, topOffset, heightMinutes } = getPosition(schedule);
    const startMinutes = hour * 60 + (topOffset / 100) * 60;
    const endMinutes = startMinutes + heightMinutes;
    return { schedule, startMinutes, endMinutes };
  });

  // 開始時間でソート
  schedulesWithTime.sort((a, b) => a.startMinutes - b.startMinutes);

  // 列配置を計算
  const result: ScheduleWithLayout[] = [];
  const columns: { endMinutes: number }[] = [];

  for (const item of schedulesWithTime) {
    // 使用可能な列を探す（終了時間が現在の開始時間より前の列）
    let assignedColumn = -1;
    for (let i = 0; i < columns.length; i++) {
      if (columns[i].endMinutes <= item.startMinutes) {
        assignedColumn = i;
        columns[i].endMinutes = item.endMinutes;
        break;
      }
    }

    // 使用可能な列がなければ新しい列を追加
    if (assignedColumn === -1) {
      assignedColumn = columns.length;
      columns.push({ endMinutes: item.endMinutes });
    }

    result.push({
      ...item,
      column: assignedColumn,
      totalColumns: 0, // 後で更新
    });
  }

  // 重なっているグループごとにtotalColumnsを計算
  for (let i = 0; i < result.length; i++) {
    const current = result[i];
    let maxColumn = current.column;
    for (let j = 0; j < result.length; j++) {
      if (i === j) continue;
      const other = result[j];
      if (current.startMinutes < other.endMinutes && current.endMinutes > other.startMinutes) {
        maxColumn = Math.max(maxColumn, other.column);
      }
    }
    current.totalColumns = maxColumn + 1;
  }

  return result;
};

export const CalendarDayView = ({
  currentDate,
  schedules,
  onTimeSlotClick,
  onScheduleClick,
}: CalendarDayViewProps) => {
  const today = new Date();
  const isToday = isSameDay(currentDate, today);

  // その日に表示すべきスケジュールを抽出
  const daySchedules = useMemo(() => {
    return schedules.filter((s) => isScheduleOnDate(s, currentDate));
  }, [currentDate, schedules]);

  const allDaySchedules = daySchedules.filter((s) => s.isAllDay);
  const timedSchedules = daySchedules.filter((s) => !s.isAllDay);

  // 表示日に応じた位置と高さを計算
  const getSchedulePosition = (schedule: Schedule) => {
    const startDate = parseISO(schedule.startAt);
    const endDate = schedule.endAt ? parseISO(schedule.endAt) : null;
    const displayDateKey = formatDate(currentDate, "yyyy-MM-dd");
    const startDateKey = schedule.startAt.split("T")[0];
    const endDateKey = schedule.endAt?.split("T")[0] || startDateKey;

    let startMinutes: number;
    let endMinutes: number;

    if (displayDateKey === startDateKey && displayDateKey === endDateKey) {
      // 同日の予定
      startMinutes = getHours(startDate) * 60 + getMinutes(startDate);
      endMinutes = endDate ? getHours(endDate) * 60 + getMinutes(endDate) : startMinutes + 60;
    } else if (displayDateKey === startDateKey) {
      // 開始日（終了日は別の日）
      startMinutes = getHours(startDate) * 60 + getMinutes(startDate);
      endMinutes = 24 * 60; // その日の終わりまで
    } else if (displayDateKey === endDateKey && endDate) {
      // 終了日
      startMinutes = 0; // その日の始まりから
      endMinutes = getHours(endDate) * 60 + getMinutes(endDate);
    } else {
      // 中間日（終日表示）
      startMinutes = 0;
      endMinutes = 24 * 60;
    }

    const hour = Math.floor(startMinutes / 60);
    const minutes = startMinutes % 60;
    const topOffset = (minutes / 60) * 100;
    const heightMinutes = Math.max(30, endMinutes - startMinutes);

    return { hour, topOffset, heightMinutes };
  };

  // 表示日に応じた時間表示を計算
  const getTimeDisplay = (schedule: Schedule): string => {
    const displayDateKey = formatDate(currentDate, "yyyy-MM-dd");
    const startDateKey = schedule.startAt.split("T")[0];
    const endDateKey = schedule.endAt?.split("T")[0] || startDateKey;
    const isStartDay = displayDateKey === startDateKey;
    const isEndDay = displayDateKey === endDateKey;

    if (isStartDay && isEndDay) {
      let display = formatDateString(schedule.startAt, "HH:mm");
      if (schedule.endAt) display += ` - ${formatDateString(schedule.endAt, "HH:mm")}`;
      return display;
    }
    if (isStartDay) {
      return `${formatDateString(schedule.startAt, "HH:mm")} →`;
    }
    if (isEndDay && schedule.endAt) {
      return `→ ${formatDateString(schedule.endAt, "HH:mm")}`;
    }
    return "終日";
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-stone-200/50 overflow-hidden flex-1 flex flex-col min-h-0">
      {/* ヘッダー */}
      <div
        className={cn(
          "border-b border-stone-100 px-5 py-4 sticky top-0 z-10",
          isToday ? "bg-accent-light/30" : "bg-stone-50/80"
        )}
      >
        <div className="text-center">
          <div
            className={cn("text-xl font-display", isToday ? "text-accent-dark" : "text-stone-900")}
          >
            {formatDate(currentDate, "yyyy年M月d日")}
          </div>
          <div className="text-sm text-stone-500 mt-0.5">{formatDate(currentDate, "EEEE")}</div>
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
                    !categoryColor &&
                      "bg-accent/10 text-accent-dark hover:bg-accent/20 hover:shadow-sm"
                  )}
                  style={
                    categoryColor
                      ? {
                          backgroundColor: `${categoryColor}20`,
                          color: categoryColor,
                        }
                      : undefined
                  }
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
            {calculateOverlapLayout(timedSchedules, getSchedulePosition).map(
              ({ schedule, startMinutes, endMinutes, column, totalColumns }) => {
                const categoryColor = schedule.category?.color;
                // パーセンテージベースで位置と高さを計算
                const topPercent = (startMinutes / (24 * 60)) * 100;
                const heightPercent = ((endMinutes - startMinutes) / (24 * 60)) * 100;

                // 横位置と幅を計算（重なり対応）
                const widthPercent = 100 / totalColumns;
                const leftPercent = column * widthPercent;

                return (
                  <button
                    key={schedule.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onScheduleClick(schedule);
                    }}
                    className={cn(
                      "absolute rounded-xl px-4 py-2 text-left overflow-hidden",
                      "font-medium transition-all duration-200",
                      "shadow-sm hover:shadow-md hover:z-10",
                      !categoryColor && "bg-accent text-white"
                    )}
                    style={{
                      top: `${topPercent}%`,
                      height: `${Math.max(2.5, heightPercent)}%`,
                      minHeight: "32px",
                      left: `calc(${leftPercent}% + 8px)`,
                      width: `calc(${widthPercent}% - 16px)`,
                      ...(categoryColor ? { backgroundColor: categoryColor, color: "white" } : {}),
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="opacity-80 text-sm">{getTimeDisplay(schedule)}</span>
                    </div>
                    <div className="truncate">{schedule.title}</div>
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
