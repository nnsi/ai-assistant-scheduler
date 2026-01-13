/**
 * 日表示カレンダーコンポーネント
 * Web版と同じデザイン
 */
import { View, Text, Pressable, ScrollView } from "react-native";
import { useMemo } from "react";
import type { Schedule, CalendarResponse } from "@ai-scheduler/shared";
import {
  format,
  isSameDay,
  parseISO,
  getHours,
  getMinutes,
} from "date-fns";
import { ja } from "date-fns/locale";

interface DayViewProps {
  currentDate: Date;
  onTimeSlotClick: (date: Date, hour: number) => void;
  onScheduleClick: (schedule: Schedule) => void;
  schedules: Schedule[];
  calendars: CalendarResponse[];
  selectedCalendarIds: string[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

// 指定した日付にスケジュールが表示されるべきか判定
const isScheduleOnDate = (schedule: Schedule, date: Date): boolean => {
  const dateKey = format(date, "yyyy-MM-dd");
  const startDateKey = schedule.startAt.split("T")[0];
  const endDateKey = schedule.endAt?.split("T")[0] || startDateKey;
  return dateKey >= startDateKey && dateKey <= endDateKey;
};

export function DayView({
  currentDate,
  onTimeSlotClick,
  onScheduleClick,
  schedules,
  calendars,
  selectedCalendarIds,
}: DayViewProps) {
  const today = new Date();
  const isTodayDate = isSameDay(currentDate, today);

  // フィルタリングされたスケジュール
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) =>
      s.calendarId && selectedCalendarIds.includes(s.calendarId)
    );
  }, [schedules, selectedCalendarIds]);

  // カレンダーID→色のマップ
  const calendarColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const calendar of calendars) {
      map.set(calendar.id, calendar.color || "#3b82f6");
    }
    return map;
  }, [calendars]);

  // その日に表示すべきスケジュールを抽出
  const daySchedules = useMemo(() => {
    return filteredSchedules.filter((s) => isScheduleOnDate(s, currentDate));
  }, [currentDate, filteredSchedules]);

  const allDaySchedules = daySchedules.filter((s) => s.isAllDay);
  const timedSchedules = daySchedules.filter((s) => !s.isAllDay);

  // 表示日に応じた位置と高さを計算
  const getSchedulePosition = (schedule: Schedule) => {
    const startDate = parseISO(schedule.startAt);
    const endDate = schedule.endAt ? parseISO(schedule.endAt) : null;
    const displayDateKey = format(currentDate, "yyyy-MM-dd");
    const startDateKey = schedule.startAt.split("T")[0];
    const endDateKey = schedule.endAt?.split("T")[0] || startDateKey;

    let startMinutes: number;
    let endMinutes: number;

    if (displayDateKey === startDateKey && displayDateKey === endDateKey) {
      startMinutes = getHours(startDate) * 60 + getMinutes(startDate);
      endMinutes = endDate
        ? getHours(endDate) * 60 + getMinutes(endDate)
        : startMinutes + 60;
    } else if (displayDateKey === startDateKey) {
      startMinutes = getHours(startDate) * 60 + getMinutes(startDate);
      endMinutes = 24 * 60;
    } else if (displayDateKey === endDateKey && endDate) {
      startMinutes = 0;
      endMinutes = getHours(endDate) * 60 + getMinutes(endDate);
    } else {
      startMinutes = 0;
      endMinutes = 24 * 60;
    }

    const heightMinutes = Math.max(30, endMinutes - startMinutes);
    return { startMinutes, endMinutes, heightMinutes };
  };

  // 表示日に応じた時間表示を計算
  const getTimeDisplay = (schedule: Schedule): string => {
    const displayDateKey = format(currentDate, "yyyy-MM-dd");
    const startDateKey = schedule.startAt.split("T")[0];
    const endDateKey = schedule.endAt?.split("T")[0] || startDateKey;
    const isStartDay = displayDateKey === startDateKey;
    const isEndDay = displayDateKey === endDateKey;

    if (isStartDay && isEndDay) {
      let display = format(parseISO(schedule.startAt), "HH:mm");
      if (schedule.endAt) display += ` - ${format(parseISO(schedule.endAt), "HH:mm")}`;
      return display;
    }
    if (isStartDay) {
      return `${format(parseISO(schedule.startAt), "HH:mm")} →`;
    }
    if (isEndDay && schedule.endAt) {
      return `→ ${format(parseISO(schedule.endAt), "HH:mm")}`;
    }
    return "終日";
  };

  return (
    <View className="flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* ヘッダー */}
      <View className={`border-b border-gray-100 px-5 py-4 ${isTodayDate ? "bg-primary-50" : "bg-gray-50"}`}>
        <Text className={`text-center text-xl font-semibold ${isTodayDate ? "text-primary-600" : "text-gray-900"}`}>
          {format(currentDate, "yyyy年M月d日", { locale: ja })}
        </Text>
        <Text className="text-center text-sm text-gray-500 mt-0.5">
          {format(currentDate, "EEEE", { locale: ja })}
        </Text>
      </View>

      {/* 終日イベントエリア */}
      {allDaySchedules.length > 0 && (
        <View className="border-b border-gray-100 bg-gray-50/50 px-5 py-3">
          <Text className="text-xs text-gray-500 font-medium mb-2">終日</Text>
          <View className="gap-1.5">
            {allDaySchedules.map((schedule) => {
              const color = (schedule.calendarId && calendarColors.get(schedule.calendarId)) || "#3b82f6";
              return (
                <Pressable
                  key={schedule.id}
                  onPress={() => onScheduleClick(schedule)}
                  className="w-full rounded-xl px-4 py-2.5"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Text style={{ color }} className="font-medium">
                    {schedule.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* 時間グリッド */}
      <ScrollView className="flex-1">
        <View className="flex-row">
          {/* 時間列 */}
          <View className="w-16">
            {HOURS.map((hour) => (
              <View
                key={hour}
                className="h-16 border-b border-gray-100 items-end justify-start pr-3"
              >
                <Text className="text-xs text-gray-400">
                  {hour.toString().padStart(2, "0")}:00
                </Text>
              </View>
            ))}
          </View>

          {/* スケジュール表示エリア */}
          <View className="flex-1 relative border-l border-gray-100">
            {HOURS.map((hour) => (
              <Pressable
                key={hour}
                onPress={() => onTimeSlotClick(currentDate, hour)}
                className="h-16 border-b border-gray-100 active:bg-gray-50"
              />
            ))}

            {/* スケジュール表示 */}
            {timedSchedules.map((schedule) => {
              const { startMinutes, heightMinutes } = getSchedulePosition(schedule);
              const topPosition = (startMinutes / 60) * 64; // 64px per hour
              const height = (heightMinutes / 60) * 64;
              const color = (schedule.calendarId && calendarColors.get(schedule.calendarId)) || "#3b82f6";

              return (
                <Pressable
                  key={schedule.id}
                  onPress={() => onScheduleClick(schedule)}
                  className="absolute left-2 right-2 rounded-xl px-4 py-2 overflow-hidden shadow-sm"
                  style={{
                    top: topPosition,
                    height: Math.max(32, height),
                    backgroundColor: color,
                  }}
                >
                  <Text className="text-sm text-white opacity-80">
                    {getTimeDisplay(schedule)}
                  </Text>
                  <Text className="text-white font-medium" numberOfLines={1}>
                    {schedule.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default DayView;
