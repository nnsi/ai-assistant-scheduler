/**
 * 週表示カレンダーコンポーネント
 * Web版と同じデザイン
 */
import { View, Text, Pressable, ScrollView } from "react-native";
import { useMemo } from "react";
import type { Schedule, CalendarResponse } from "@ai-scheduler/shared";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  parseISO,
  getHours,
  getMinutes,
} from "date-fns";
import { ja } from "date-fns/locale";

interface WeekViewProps {
  currentDate: Date;
  onTimeSlotClick: (date: Date, hour: number) => void;
  onScheduleClick: (schedule: Schedule) => void;
  schedules: Schedule[];
  calendars: CalendarResponse[];
  selectedCalendarIds: string[];
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// 指定した日付にスケジュールが表示されるべきか判定
const isScheduleOnDate = (schedule: Schedule, date: Date): boolean => {
  const dateKey = format(date, "yyyy-MM-dd");
  const startDateKey = schedule.startAt.split("T")[0];
  const endDateKey = schedule.endAt?.split("T")[0] || startDateKey;
  return dateKey >= startDateKey && dateKey <= endDateKey;
};

export function WeekView({
  currentDate,
  onTimeSlotClick,
  onScheduleClick,
  schedules,
  calendars,
  selectedCalendarIds,
}: WeekViewProps) {
  // 週の日付配列を生成
  const days = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

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

  // 指定した日付に表示すべきスケジュールを取得
  const getSchedulesForDate = (date: Date): Schedule[] => {
    return filteredSchedules.filter((schedule) => isScheduleOnDate(schedule, date));
  };

  // 表示日に応じた位置と高さを計算
  const getSchedulePosition = (schedule: Schedule, displayDate: Date) => {
    const startDate = parseISO(schedule.startAt);
    const endDate = schedule.endAt ? parseISO(schedule.endAt) : null;
    const displayDateKey = format(displayDate, "yyyy-MM-dd");
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

  const today = new Date();

  return (
    <View className="flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* 曜日ヘッダー */}
      <View className="flex-row bg-gray-50 border-b border-gray-100">
        <View className="w-12 py-2 items-center justify-center">
          <Text className="text-xs text-gray-500">時間</Text>
        </View>
        {days.map((date, index) => {
          const isTodayDate = isToday(date);
          return (
            <View
              key={date.toISOString()}
              className={`flex-1 py-2 items-center border-l border-gray-100 ${
                isTodayDate ? "bg-primary-50" : ""
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  index === 0 ? "text-rose-500" : index === 6 ? "text-sky-500" : "text-gray-600"
                }`}
              >
                {WEEKDAYS[index]}
              </Text>
              <View
                className={`mt-1 w-6 h-6 items-center justify-center rounded-full ${
                  isTodayDate ? "bg-primary-500" : ""
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isTodayDate ? "text-white" : "text-gray-900"
                  }`}
                >
                  {format(date, "d")}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* 終日イベントエリア */}
      <View className="flex-row border-b border-gray-100">
        <View className="w-12 py-1 items-center justify-center">
          <Text className="text-xs text-gray-500">終日</Text>
        </View>
        {days.map((date) => {
          const daySchedules = getSchedulesForDate(date).filter((s) => s.isAllDay);
          return (
            <View
              key={date.toISOString()}
              className="flex-1 py-1 px-0.5 border-l border-gray-100 min-h-[28px]"
            >
              {daySchedules.slice(0, 2).map((schedule) => (
                <Pressable
                  key={schedule.id}
                  onPress={() => onScheduleClick(schedule)}
                  className="rounded px-1 py-0.5 mb-0.5"
                  style={{
                    backgroundColor: (schedule.calendarId && calendarColors.get(schedule.calendarId)) || "#3b82f6",
                  }}
                >
                  <Text className="text-xs text-white" numberOfLines={1}>
                    {schedule.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          );
        })}
      </View>

      {/* 時間グリッド */}
      <ScrollView className="flex-1">
        <View className="flex-row">
          {/* 時間列 */}
          <View className="w-12">
            {HOURS.map((hour) => (
              <View
                key={hour}
                className="h-12 border-b border-gray-100 items-end justify-start pr-1"
              >
                <Text className="text-xs text-gray-400">
                  {hour.toString().padStart(2, "0")}:00
                </Text>
              </View>
            ))}
          </View>

          {/* 日ごとの列 */}
          {days.map((date) => {
            const daySchedules = getSchedulesForDate(date).filter((s) => !s.isAllDay);

            return (
              <View key={date.toISOString()} className="flex-1 relative border-l border-gray-100">
                {HOURS.map((hour) => (
                  <Pressable
                    key={hour}
                    onPress={() => onTimeSlotClick(date, hour)}
                    className="h-12 border-b border-gray-100 active:bg-gray-50"
                  />
                ))}

                {/* スケジュール表示 */}
                {daySchedules.map((schedule) => {
                  const { startMinutes, heightMinutes } = getSchedulePosition(schedule, date);
                  const topPosition = (startMinutes / 60) * 48; // 48px per hour
                  const height = (heightMinutes / 60) * 48;
                  const color = (schedule.calendarId && calendarColors.get(schedule.calendarId)) || "#3b82f6";

                  return (
                    <Pressable
                      key={schedule.id}
                      onPress={() => onScheduleClick(schedule)}
                      className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 overflow-hidden"
                      style={{
                        top: topPosition,
                        height: Math.max(18, height),
                        backgroundColor: color,
                      }}
                    >
                      <Text className="text-xs text-white" numberOfLines={1}>
                        {schedule.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default WeekView;
