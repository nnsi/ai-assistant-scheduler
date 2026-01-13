/**
 * カレンダー画面（ホーム）
 */
import { useState, useMemo, useCallback } from "react";
import { View, Modal, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSchedules, useCalendarContext } from "@ai-scheduler/core";
import { format, getYear, getMonth } from "date-fns";
import { MonthView } from "../../../src/components/calendar/MonthView";
import { DayScheduleList } from "../../../src/components/calendar/DayScheduleList";
import { LoadingSpinner, ErrorMessage } from "../../../src/components/ui";

export default function CalendarScreen() {
  const router = useRouter();
  const { calendars, selectedCalendarIds, isLoading: calendarsLoading } = useCalendarContext();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 現在の月のスケジュールを取得
  const year = getYear(currentDate);
  const month = getMonth(currentDate) + 1; // 1-indexed

  const { schedules, isLoading: schedulesLoading, error, refetch } = useSchedules(year, month);

  // 選択されたカレンダーのスケジュールのみフィルタ
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => s.calendarId && selectedCalendarIds.includes(s.calendarId));
  }, [schedules, selectedCalendarIds]);

  // 選択された日のスケジュール
  const selectedDateSchedules = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return filteredSchedules.filter((s) => {
      const scheduleDate = format(new Date(s.startAt), "yyyy-MM-dd");
      return scheduleDate === dateKey;
    });
  }, [selectedDate, filteredSchedules]);

  // ScheduleOccurrenceをSchedule互換に変換
  const schedulesForView = useMemo(() => {
    return filteredSchedules.map((s) => ({
      id: s.id,
      title: s.title,
      startAt: s.startAt,
      endAt: s.endAt,
      isAllDay: s.isAllDay,
      calendarId: s.calendarId,
      recurrence: s.recurrence,
    }));
  }, [filteredSchedules]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleSchedulePress = useCallback(
    (schedule: { id: string }) => {
      setSelectedDate(null);
      router.push(`/(app)/schedule/${schedule.id}`);
    },
    [router]
  );

  const handleAddSchedule = useCallback(() => {
    setSelectedDate(null);
    if (selectedDate) {
      router.push({
        pathname: "/(app)/schedule/new",
        params: { date: format(selectedDate, "yyyy-MM-dd") },
      });
    } else {
      router.push("/(app)/schedule/new");
    }
  }, [router, selectedDate]);

  const isLoading = calendarsLoading || schedulesLoading;

  if (isLoading && schedules.length === 0) {
    return <LoadingSpinner fullScreen message="読み込み中..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        fullScreen
        message="スケジュールの読み込みに失敗しました"
        onRetry={refetch}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* カレンダーセレクター（ヘッダー） */}
      <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-2">
        <Pressable
          onPress={() => router.push("/(app)/calendar/select")}
          className="flex-row items-center rounded-lg bg-gray-100 px-3 py-1.5 active:bg-gray-200"
        >
          <MaterialIcons name="event" size={18} color="#374151" />
          <Text className="ml-1 text-sm font-medium text-gray-700">
            {selectedCalendarIds.length === calendars.length
              ? "すべてのカレンダー"
              : `${selectedCalendarIds.length}個選択中`}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={20} color="#374151" />
        </Pressable>

        <Pressable
          onPress={handleAddSchedule}
          className="rounded-full bg-primary-500 p-2 active:bg-primary-600"
        >
          <MaterialIcons name="add" size={24} color="#ffffff" />
        </Pressable>
      </View>

      {/* 月表示カレンダー */}
      <MonthView
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onDateSelect={handleDateSelect}
        schedules={schedulesForView as any}
        calendars={calendars}
        selectedCalendarIds={selectedCalendarIds}
      />

      {/* 日付選択モーダル */}
      <Modal
        visible={!!selectedDate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedDate(null)}
      >
        {selectedDate && (
          <DayScheduleList
            date={selectedDate}
            schedules={selectedDateSchedules.map((s) => ({
              id: s.id,
              title: s.title,
              startAt: s.startAt,
              endAt: s.endAt,
              isAllDay: s.isAllDay,
              calendarId: s.calendarId,
              recurrence: s.recurrence,
            })) as any}
            calendars={calendars}
            onSchedulePress={handleSchedulePress}
            onAddPress={handleAddSchedule}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}
