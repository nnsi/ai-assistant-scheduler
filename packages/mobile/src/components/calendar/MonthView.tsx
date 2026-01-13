/**
 * 月表示カレンダーコンポーネント
 * Web版と同じデザイン
 */
import { View, Text, Pressable, ScrollView } from "react-native";
import { useMemo } from "react";
import type { Schedule, CalendarResponse } from "@ai-scheduler/shared";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from "date-fns";

interface MonthViewProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onScheduleClick: (schedule: Schedule) => void;
  schedules: Schedule[];
  calendars: CalendarResponse[];
  selectedCalendarIds: string[];
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function MonthView({
  currentDate,
  onDateSelect,
  onScheduleClick,
  schedules,
  calendars,
  selectedCalendarIds,
}: MonthViewProps) {
  // 月の日付配列を生成（前後の週も含む）
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // 日付ごとのスケジュールをマップ
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, Schedule[]>();

    const filteredSchedules = schedules.filter((s) =>
      s.calendarId && selectedCalendarIds.includes(s.calendarId)
    );

    for (const schedule of filteredSchedules) {
      const dateKey = format(new Date(schedule.startAt), "yyyy-MM-dd");
      const existing = map.get(dateKey) || [];
      existing.push(schedule);
      map.set(dateKey, existing);
    }

    return map;
  }, [schedules, selectedCalendarIds]);

  // カレンダーID→色のマップ
  const calendarColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const calendar of calendars) {
      map.set(calendar.id, calendar.color || "#3b82f6");
    }
    return map;
  }, [calendars]);

  return (
    <View className="flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* 曜日ヘッダー */}
      <View className="flex-row bg-gray-50 border-b border-gray-100">
        {WEEKDAYS.map((day, index) => (
          <View key={day} className="flex-1 items-center py-2.5">
            <Text
              className={`text-sm font-medium ${
                index === 0 ? "text-rose-500" : index === 6 ? "text-sky-500" : "text-gray-600"
              }`}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* カレンダーグリッド */}
      <ScrollView className="flex-1">
        <View className="flex-row flex-wrap">
          {days.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const daySchedules = schedulesByDate.get(dateKey) || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const dayOfWeek = day.getDay();

            return (
              <Pressable
                key={dateKey}
                onPress={() => onDateSelect(day)}
                className={`w-[14.28%] border-b border-r border-gray-100 p-1 ${
                  !isCurrentMonth ? "bg-gray-50/50" : ""
                }`}
                style={{ minHeight: 80 }}
              >
                <View
                  className={`mb-1 h-7 w-7 items-center justify-center self-center rounded-full ${
                    isTodayDate ? "bg-primary-500" : ""
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isTodayDate
                        ? "text-white"
                        : !isCurrentMonth
                          ? "text-gray-400"
                          : dayOfWeek === 0
                            ? "text-rose-500"
                            : dayOfWeek === 6
                              ? "text-sky-500"
                              : "text-gray-900"
                    }`}
                  >
                    {format(day, "d")}
                  </Text>
                </View>

                {/* スケジュール表示 */}
                <View className="flex-1 gap-0.5">
                  {daySchedules.slice(0, 3).map((schedule) => (
                    <Pressable
                      key={schedule.id}
                      onPress={(e) => {
                        e.stopPropagation();
                        onScheduleClick(schedule);
                      }}
                      className="rounded px-1 py-0.5"
                      style={{
                        backgroundColor: (schedule.calendarId && calendarColors.get(schedule.calendarId)) || "#3b82f6",
                      }}
                    >
                      <Text
                        className="text-xs text-white"
                        numberOfLines={1}
                      >
                        {schedule.title}
                      </Text>
                    </Pressable>
                  ))}
                  {daySchedules.length > 3 && (
                    <Text className="text-center text-xs text-gray-500">
                      +{daySchedules.length - 3}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default MonthView;
