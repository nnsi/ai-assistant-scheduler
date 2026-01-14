import { cn } from "@/lib/cn";
import {
  formatDate,
  formatDateString,
  getHours,
  getMinutes,
  getWeekDayLabels,
  getWeekDays,
  isSameDay,
  parseISO,
} from "@/lib/date";
import type { Schedule } from "@ai-scheduler/shared";
import { useMemo } from "react";

type CalendarWeekViewProps = {
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
  displayDate: Date,
  getPosition: (s: Schedule, d: Date) => { hour: number; topOffset: number; heightMinutes: number }
): ScheduleWithLayout[] => {
  if (schedules.length === 0) return [];

  // 各予定の開始・終了分を計算
  const schedulesWithTime = schedules.map((schedule) => {
    const { hour, topOffset, heightMinutes } = getPosition(schedule, displayDate);
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
    // この予定と重なっている予定を探す
    let maxColumn = current.column;
    for (let j = 0; j < result.length; j++) {
      if (i === j) continue;
      const other = result[j];
      // 時間が重なっているか確認
      if (current.startMinutes < other.endMinutes && current.endMinutes > other.startMinutes) {
        maxColumn = Math.max(maxColumn, other.column);
      }
    }
    current.totalColumns = maxColumn + 1;
  }

  return result;
};

export const CalendarWeekView = ({
  currentDate,
  schedules,
  onTimeSlotClick,
  onScheduleClick,
}: CalendarWeekViewProps) => {
  const days = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const weekDayLabels = getWeekDayLabels();
  const today = new Date();

  // 指定した日付に表示すべきスケジュールを取得
  const getSchedulesForDate = (date: Date): Schedule[] => {
    return schedules.filter((schedule) => isScheduleOnDate(schedule, date));
  };

  // 表示日に応じた位置と高さを計算
  const getSchedulePosition = (schedule: Schedule, displayDate: Date) => {
    const startDate = parseISO(schedule.startAt);
    const endDate = schedule.endAt ? parseISO(schedule.endAt) : null;
    const displayDateKey = formatDate(displayDate, "yyyy-MM-dd");
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
            <div className="py-1 sm:py-1.5 text-center text-[10px] sm:text-xs text-stone-500 font-medium">
              終日
            </div>
            {days.map((date) => {
              const daySchedules = getSchedulesForDate(date).filter((s) => s.isAllDay);
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
                className="h-12 border-b border-stone-100 text-right pr-1 sm:pr-3 text-[10px] sm:text-xs text-stone-400 font-medium"
              >
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* 日ごとの列 */}
          {days.map((date) => {
            const daySchedules = getSchedulesForDate(date).filter((s) => !s.isAllDay);
            const layoutSchedules = calculateOverlapLayout(daySchedules, date, getSchedulePosition);

            return (
              <div key={date.toISOString()} className="relative border-l border-stone-100">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="h-12 border-b border-stone-100 hover:bg-stone-50 cursor-pointer transition-colors"
                    onClick={() => onTimeSlotClick(date, hour)}
                  />
                ))}

                {/* スケジュール表示 */}
                {layoutSchedules.map(
                  ({ schedule, startMinutes, endMinutes, column, totalColumns }) => {
                    const categoryColor = schedule.category?.color;
                    // パーセンテージベースで位置と高さを計算
                    const topPercent = (startMinutes / (24 * 60)) * 100;
                    const heightPercent = ((endMinutes - startMinutes) / (24 * 60)) * 100;

                    // 横位置と幅を計算（重なり対応）
                    const widthPercent = 100 / totalColumns;
                    const leftPercent = column * widthPercent;

                    // 表示日に応じた時間表示を計算
                    const displayDateKey = formatDate(date, "yyyy-MM-dd");
                    const startDateKey = schedule.startAt.split("T")[0];
                    const endDateKey = schedule.endAt?.split("T")[0] || startDateKey;
                    const isStartDay = displayDateKey === startDateKey;
                    const isEndDay = displayDateKey === endDateKey;

                    let timeDisplay = "";
                    if (isStartDay && isEndDay) {
                      timeDisplay = formatDateString(schedule.startAt, "HH:mm");
                      if (schedule.endAt)
                        timeDisplay += `-${formatDateString(schedule.endAt, "HH:mm")}`;
                    } else if (isStartDay) {
                      timeDisplay = `${formatDateString(schedule.startAt, "HH:mm")}→`;
                    } else if (isEndDay && schedule.endAt) {
                      timeDisplay = `→${formatDateString(schedule.endAt, "HH:mm")}`;
                    } else {
                      timeDisplay = "終日";
                    }

                    return (
                      <button
                        key={schedule.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onScheduleClick(schedule);
                        }}
                        className={cn(
                          "absolute rounded sm:rounded-lg px-0.5 sm:px-1.5 py-0.5 sm:py-1 text-left overflow-hidden",
                          "text-[10px] sm:text-xs font-medium transition-all duration-200",
                          "shadow-sm hover:shadow-md hover:z-10",
                          !categoryColor && "bg-accent text-white"
                        )}
                        style={{
                          top: `${topPercent}%`,
                          height: `${Math.max(1.5, heightPercent)}%`,
                          minHeight: "18px",
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          ...(categoryColor
                            ? { backgroundColor: categoryColor, color: "white" }
                            : {}),
                        }}
                      >
                        <span className="opacity-80 hidden sm:inline">{timeDisplay}</span>
                        <span className="sm:ml-1 truncate block">{schedule.title}</span>
                      </button>
                    );
                  }
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
