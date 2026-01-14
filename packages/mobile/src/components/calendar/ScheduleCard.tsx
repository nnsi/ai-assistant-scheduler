import type { CalendarResponse, Schedule } from "@ai-scheduler/shared";
import { MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns";
/**
 * スケジュールカードコンポーネント
 */
import { Pressable, Text, View } from "react-native";

interface ScheduleCardProps {
  schedule: Schedule;
  calendar?: CalendarResponse;
  onPress: () => void;
  compact?: boolean;
}

export function ScheduleCard({ schedule, calendar, onPress, compact = false }: ScheduleCardProps) {
  const startTime = new Date(schedule.startAt);
  const endTime = schedule.endAt ? new Date(schedule.endAt) : startTime;
  const calendarColor = calendar?.color || "#3b82f6";

  const isAllDay = schedule.isAllDay;
  const hasRecurrence = !!schedule.recurrence;

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        className="flex-row items-center rounded-lg bg-white p-3 active:bg-gray-50"
      >
        <View className="mr-3 h-full w-1 rounded-full" style={{ backgroundColor: calendarColor }} />
        <View className="flex-1">
          <Text className="font-medium text-gray-900" numberOfLines={1}>
            {schedule.title}
          </Text>
          <Text className="text-sm text-gray-500">
            {isAllDay ? "終日" : `${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")}`}
          </Text>
        </View>
        {hasRecurrence && <MaterialIcons name="repeat" size={18} color="#9ca3af" />}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className="mb-2 rounded-xl bg-white p-4 shadow-sm active:bg-gray-50"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: calendarColor,
      }}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">{schedule.title}</Text>

          <View className="mt-2 flex-row items-center">
            <MaterialIcons name="access-time" size={16} color="#6b7280" />
            <Text className="ml-1 text-sm text-gray-600">
              {isAllDay ? "終日" : `${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")}`}
            </Text>
          </View>

          {calendar && (
            <View className="mt-1 flex-row items-center">
              <View
                className="mr-1 h-3 w-3 rounded-full"
                style={{ backgroundColor: calendarColor }}
              />
              <Text className="text-sm text-gray-500">{calendar.name}</Text>
            </View>
          )}
        </View>

        <View className="ml-2 flex-row items-center">
          {hasRecurrence && <MaterialIcons name="repeat" size={20} color="#9ca3af" />}
          <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
        </View>
      </View>
    </Pressable>
  );
}

export default ScheduleCard;
