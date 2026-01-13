/**
 * 日付選択時のスケジュールリストコンポーネント
 */
import { View, Text, ScrollView, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { Schedule, CalendarResponse } from "@ai-scheduler/shared";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ScheduleCard } from "./ScheduleCard";

interface DayScheduleListProps {
  date: Date;
  schedules: Schedule[];
  calendars: CalendarResponse[];
  onSchedulePress: (schedule: Schedule) => void;
  onAddPress: () => void;
  onClose: () => void;
}

export function DayScheduleList({
  date,
  schedules,
  calendars,
  onSchedulePress,
  onAddPress,
  onClose,
}: DayScheduleListProps) {
  // カレンダーID→カレンダーのマップ
  const calendarMap = new Map(calendars.map((c) => [c.id, c]));

  // 時間順にソート
  const sortedSchedules = [...schedules].sort((a, b) => {
    // 終日イベントを先頭に
    if (a.isAllDay && !b.isAllDay) return -1;
    if (!a.isAllDay && b.isAllDay) return 1;
    return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
  });

  return (
    <View className="flex-1 bg-gray-50">
      {/* ヘッダー */}
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <Pressable onPress={onClose} className="p-1">
          <MaterialIcons name="close" size={24} color="#374151" />
        </Pressable>

        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-gray-900">
            {format(date, "M月d日(E)", { locale: ja })}
          </Text>
        </View>

        <Pressable
          onPress={onAddPress}
          className="rounded-full bg-primary-500 p-2 active:bg-primary-600"
        >
          <MaterialIcons name="add" size={20} color="#ffffff" />
        </Pressable>
      </View>

      {/* スケジュールリスト */}
      <ScrollView className="flex-1 px-4 py-4">
        {sortedSchedules.length === 0 ? (
          <View className="items-center py-12">
            <MaterialIcons name="event-available" size={48} color="#d1d5db" />
            <Text className="mt-2 text-gray-500">予定がありません</Text>
            <Pressable
              onPress={onAddPress}
              className="mt-4 flex-row items-center rounded-lg bg-primary-500 px-4 py-2 active:bg-primary-600"
            >
              <MaterialIcons name="add" size={20} color="#ffffff" />
              <Text className="ml-1 font-medium text-white">予定を追加</Text>
            </Pressable>
          </View>
        ) : (
          sortedSchedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              calendar={schedule.calendarId ? calendarMap.get(schedule.calendarId) : undefined}
              onPress={() => onSchedulePress(schedule)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

export default DayScheduleList;
