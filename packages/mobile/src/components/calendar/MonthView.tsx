/**
 * 月表示カレンダーコンポーネント
 * モバイル最適化：コンパクトなセル、見やすい予定表示
 */
import { View, Text, Pressable, ScrollView, useWindowDimensions } from "react-native";
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
  const { width } = useWindowDimensions();
  const cellWidth = Math.floor(width / 7) - 2;

  // 月の日付配列を生成（前後の週も含む）
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // 週数を計算して高さを調整
  const weekCount = Math.ceil(days.length / 7);

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
    <View className="flex-1 bg-white rounded-xl overflow-hidden shadow-sm">
      {/* 曜日ヘッダー - コンパクト化 */}
      <View className="flex-row border-b border-gray-100">
        {WEEKDAYS.map((day, index) => (
          <View key={day} className="flex-1 items-center py-2">
            <Text
              className={`text-xs font-semibold ${
                index === 0 ? "text-rose-500" : index === 6 ? "text-sky-500" : "text-gray-500"
              }`}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* カレンダーグリッド */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap">
          {days.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const daySchedules = schedulesByDate.get(dateKey) || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const dayOfWeek = day.getDay();
            const hasSchedules = daySchedules.length > 0;

            return (
              <Pressable
                key={dateKey}
                onPress={() => onDateSelect(day)}
                className={`w-[14.28%] border-b border-r border-gray-50 ${
                  !isCurrentMonth ? "bg-gray-50/30" : "active:bg-gray-50"
                }`}
                style={{ minHeight: weekCount <= 5 ? 90 : 76 }}
              >
                {/* 日付 */}
                <View className="items-center pt-1">
                  <View
                    className={`w-7 h-7 items-center justify-center rounded-full ${
                      isTodayDate ? "bg-primary-500" : ""
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        isTodayDate
                          ? "text-white font-bold"
                          : !isCurrentMonth
                            ? "text-gray-300"
                            : dayOfWeek === 0
                              ? "text-rose-500 font-medium"
                              : dayOfWeek === 6
                                ? "text-sky-500 font-medium"
                                : "text-gray-800 font-medium"
                      }`}
                    >
                      {format(day, "d")}
                    </Text>
                  </View>
                </View>

                {/* スケジュール表示 - よりコンパクトに */}
                <View className="flex-1 px-0.5 pb-1 gap-0.5 mt-0.5">
                  {daySchedules.slice(0, 2).map((schedule) => (
                    <Pressable
                      key={schedule.id}
                      onPress={(e) => {
                        e.stopPropagation();
                        onScheduleClick(schedule);
                      }}
                      className="rounded-sm px-1 py-0.5"
                      style={{
                        backgroundColor: (schedule.calendarId && calendarColors.get(schedule.calendarId)) || "#3b82f6",
                      }}
                    >
                      <Text
                        className="text-[10px] text-white font-medium"
                        numberOfLines={1}
                      >
                        {schedule.title}
                      </Text>
                    </Pressable>
                  ))}
                  {daySchedules.length > 2 && (
                    <View className="items-center">
                      <Text className="text-[10px] text-gray-400 font-medium">
                        +{daySchedules.length - 2}
                      </Text>
                    </View>
                  )}
                  {/* 予定があることを示すドット（予定が表示しきれない場合） */}
                  {!hasSchedules && isCurrentMonth && (
                    <View className="flex-1" />
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
