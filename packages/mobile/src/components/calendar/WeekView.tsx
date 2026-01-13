/**
 * 週表示カレンダーコンポーネント
 * モバイル最適化：コンパクトなヘッダー、見やすい時間軸
 */
import { View, Text, Pressable, ScrollView } from "react-native";
import { useMemo, useRef, useEffect } from "react";
import type { Schedule, CalendarResponse, Category } from "@ai-scheduler/shared";
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
  categories: Category[];
  selectedCalendarIds: string[];
}

const WEEKDAYS_SHORT = ["日", "月", "火", "水", "木", "金", "土"];
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
  categories,
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

  // カレンダーID→色のマップ（フォールバック用）
  const calendarColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const calendar of calendars) {
      map.set(calendar.id, calendar.color || "#3b82f6");
    }
    return map;
  }, [calendars]);

  // カテゴリID→色のマップ
  const categoryColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) {
      map.set(category.id, category.color || "#3b82f6");
    }
    return map;
  }, [categories]);

  // 予定の色を取得（カテゴリ優先、なければカレンダー色）
  const getScheduleColor = (schedule: Schedule): string => {
    if (schedule.categoryId && categoryColors.has(schedule.categoryId)) {
      return categoryColors.get(schedule.categoryId)!;
    }
    if (schedule.calendarId && calendarColors.has(schedule.calendarId)) {
      return calendarColors.get(schedule.calendarId)!;
    }
    return "#3b82f6";
  };

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
  const scrollViewRef = useRef<ScrollView>(null);

  // 初期表示時に現在時刻付近にスクロール
  useEffect(() => {
    const currentHour = new Date().getHours();
    const scrollTo = Math.max(0, (currentHour - 1) * 48);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: scrollTo, animated: false });
    }, 100);
  }, []);

  return (
    <View className="flex-1 bg-white rounded-xl overflow-hidden shadow-sm">
      {/* 曜日ヘッダー - コンパクト化 */}
      <View className="flex-row border-b border-gray-100">
        <View className="w-10 py-1.5 items-center justify-center" />
        {days.map((date, index) => {
          const isTodayDate = isToday(date);
          return (
            <View
              key={date.toISOString()}
              className={`flex-1 py-1.5 items-center ${
                isTodayDate ? "bg-primary-50" : ""
              }`}
            >
              <Text
                className={`text-[10px] font-medium ${
                  index === 0 ? "text-rose-500" : index === 6 ? "text-sky-500" : "text-gray-500"
                }`}
              >
                {WEEKDAYS_SHORT[index]}
              </Text>
              <View
                className={`mt-0.5 w-6 h-6 items-center justify-center rounded-full ${
                  isTodayDate ? "bg-primary-500" : ""
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isTodayDate ? "text-white" : "text-gray-800"
                  }`}
                >
                  {format(date, "d")}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* 終日イベントエリア - 予定がある場合のみ表示 */}
      {days.some((date) => getSchedulesForDate(date).some((s) => s.isAllDay)) && (
        <View className="flex-row border-b border-gray-100 bg-gray-50/50">
          <View className="w-10 py-1 items-center justify-center">
            <Text className="text-[10px] text-gray-400">終日</Text>
          </View>
          {days.map((date) => {
            const daySchedules = getSchedulesForDate(date).filter((s) => s.isAllDay);
            return (
              <View
                key={date.toISOString()}
                className="flex-1 py-1 px-0.5 min-h-[24px]"
              >
                {daySchedules.slice(0, 1).map((schedule) => (
                  <Pressable
                    key={schedule.id}
                    onPress={() => onScheduleClick(schedule)}
                    className="rounded-sm px-0.5 py-0.5"
                    style={{
                      backgroundColor: getScheduleColor(schedule),
                    }}
                  >
                    <Text className="text-[9px] text-white font-medium" numberOfLines={1}>
                      {schedule.title}
                    </Text>
                  </Pressable>
                ))}
                {daySchedules.length > 1 && (
                  <Text className="text-[9px] text-gray-400 text-center">+{daySchedules.length - 1}</Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* 時間グリッド */}
      <ScrollView ref={scrollViewRef} className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-row">
          {/* 時間列 */}
          <View className="w-10">
            {HOURS.map((hour) => (
              <View
                key={hour}
                className="h-12 border-b border-gray-50 items-center justify-start"
              >
                <Text className="text-[10px] text-gray-400 mt-[-5px]">
                  {hour.toString().padStart(2, "0")}
                </Text>
              </View>
            ))}
          </View>

          {/* 日ごとの列 */}
          {days.map((date, dayIndex) => {
            const daySchedules = getSchedulesForDate(date).filter((s) => !s.isAllDay);
            const isTodayDate = isToday(date);

            return (
              <View
                key={date.toISOString()}
                className={`flex-1 relative border-l border-gray-50 ${isTodayDate ? "bg-primary-50/30" : ""}`}
              >
                {HOURS.map((hour) => (
                  <Pressable
                    key={hour}
                    onPress={() => onTimeSlotClick(date, hour)}
                    className="h-12 border-b border-gray-50 active:bg-gray-100"
                  />
                ))}

                {/* スケジュール表示 */}
                {daySchedules.map((schedule) => {
                  const { startMinutes, heightMinutes } = getSchedulePosition(schedule, date);
                  const topPosition = (startMinutes / 60) * 48;
                  const height = (heightMinutes / 60) * 48;
                  const color = getScheduleColor(schedule);

                  return (
                    <Pressable
                      key={schedule.id}
                      onPress={() => onScheduleClick(schedule)}
                      className="absolute left-0.5 right-0.5 rounded-sm px-1 py-0.5 overflow-hidden"
                      style={{
                        top: topPosition,
                        height: Math.max(16, height),
                        backgroundColor: color,
                      }}
                    >
                      <Text className="text-[10px] text-white font-medium" numberOfLines={1}>
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
