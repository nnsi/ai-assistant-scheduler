/**
 * 日表示カレンダーコンポーネント
 * モバイル最適化：シンプルなヘッダー、見やすい予定カード
 */
import { View, Text, Pressable, ScrollView } from "react-native";
import { useMemo, useRef, useEffect } from "react";
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

  const scrollViewRef = useRef<ScrollView>(null);

  // 初期表示時に現在時刻付近にスクロール
  useEffect(() => {
    const currentHour = new Date().getHours();
    const scrollTo = Math.max(0, (currentHour - 1) * 56);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: scrollTo, animated: false });
    }, 100);
  }, []);

  return (
    <View className="flex-1 bg-white rounded-xl overflow-hidden shadow-sm">
      {/* ヘッダー - シンプル化 */}
      <View className={`border-b border-gray-100 px-4 py-3 ${isTodayDate ? "bg-primary-50" : ""}`}>
        <View className="flex-row items-center justify-center gap-2">
          <Text className={`text-lg font-bold ${isTodayDate ? "text-primary-600" : "text-gray-900"}`}>
            {format(currentDate, "M月d日", { locale: ja })}
          </Text>
          <Text className={`text-base ${isTodayDate ? "text-primary-500" : "text-gray-500"}`}>
            {format(currentDate, "EEEE", { locale: ja })}
          </Text>
        </View>
      </View>

      {/* 終日イベントエリア - 予定がある場合のみ表示 */}
      {allDaySchedules.length > 0 && (
        <View className="border-b border-gray-100 bg-gray-50/50 px-4 py-2">
          <View className="gap-1.5">
            {allDaySchedules.map((schedule) => {
              const color = (schedule.calendarId && calendarColors.get(schedule.calendarId)) || "#3b82f6";
              return (
                <Pressable
                  key={schedule.id}
                  onPress={() => onScheduleClick(schedule)}
                  className="rounded-lg px-3 py-2"
                  style={{ backgroundColor: color }}
                >
                  <Text className="text-white font-medium text-sm">
                    {schedule.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* 時間グリッド */}
      <ScrollView ref={scrollViewRef} className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-row">
          {/* 時間列 */}
          <View className="w-12">
            {HOURS.map((hour) => (
              <View
                key={hour}
                className="h-14 border-b border-gray-50 items-center justify-start"
              >
                <Text className="text-xs text-gray-400 mt-[-5px]">
                  {hour.toString().padStart(2, "0")}:00
                </Text>
              </View>
            ))}
          </View>

          {/* スケジュール表示エリア */}
          <View className="flex-1 relative border-l border-gray-50">
            {HOURS.map((hour) => (
              <Pressable
                key={hour}
                onPress={() => onTimeSlotClick(currentDate, hour)}
                className="h-14 border-b border-gray-50 active:bg-gray-100"
              />
            ))}

            {/* スケジュール表示 */}
            {timedSchedules.map((schedule) => {
              const { startMinutes, heightMinutes } = getSchedulePosition(schedule);
              const topPosition = (startMinutes / 60) * 56; // 56px per hour
              const height = (heightMinutes / 60) * 56;
              const color = (schedule.calendarId && calendarColors.get(schedule.calendarId)) || "#3b82f6";

              return (
                <Pressable
                  key={schedule.id}
                  onPress={() => onScheduleClick(schedule)}
                  className="absolute left-1 right-1 rounded-lg px-3 py-1.5 overflow-hidden"
                  style={{
                    top: topPosition,
                    height: Math.max(28, height),
                    backgroundColor: color,
                  }}
                >
                  <Text className="text-xs text-white/80">
                    {getTimeDisplay(schedule)}
                  </Text>
                  <Text className="text-white font-medium text-sm" numberOfLines={1}>
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
