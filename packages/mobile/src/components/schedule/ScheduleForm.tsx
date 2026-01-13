/**
 * スケジュール作成・編集フォームコンポーネント
 */
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Switch,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import type { Schedule, CalendarResponse, Category } from "@ai-scheduler/shared";
import { format, addHours, setHours, setMinutes, startOfDay } from "date-fns";
import { Button } from "../ui/Button";

interface ScheduleFormData {
  title: string;
  startAt: Date;
  endAt: Date;
  isAllDay: boolean;
  calendarId: string;
  categoryId: string | null;
  userMemo: string;
  recurrenceRule: {
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
  } | null;
}

interface ScheduleFormProps {
  initialData?: Partial<Schedule>;
  initialDate?: Date;
  calendars: CalendarResponse[];
  categories: Category[];
  defaultCalendarId: string | null;
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  onCancel: () => void;
  onAISearch?: (title: string, startAt: Date) => void;
  isSubmitting: boolean;
  isEditMode?: boolean;
}

export function ScheduleForm({
  initialData,
  initialDate,
  calendars,
  categories,
  defaultCalendarId,
  onSubmit,
  onCancel,
  onAISearch,
  isSubmitting,
  isEditMode = false,
}: ScheduleFormProps) {
  // フォーム状態
  const [title, setTitle] = useState(initialData?.title || "");
  const [isAllDay, setIsAllDay] = useState(initialData?.isAllDay || false);
  const [calendarId, setCalendarId] = useState(
    initialData?.calendarId || defaultCalendarId || calendars[0]?.id || ""
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    initialData?.categoryId || null
  );
  const [userMemo, setUserMemo] = useState(initialData?.userMemo || "");
  const [hasRecurrence, setHasRecurrence] = useState(!!initialData?.recurrenceRule);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<"daily" | "weekly" | "monthly" | "yearly">(
    initialData?.recurrenceRule?.frequency || "weekly"
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState(
    initialData?.recurrenceRule?.interval || 1
  );
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);

  // 日時
  const defaultDate = initialDate || new Date();
  const [startTime, setStartTime] = useState<Date>(
    initialData?.startAt
      ? new Date(initialData.startAt)
      : setMinutes(setHours(defaultDate, defaultDate.getHours() + 1), 0)
  );
  const [endTime, setEndTime] = useState<Date>(
    initialData?.endAt
      ? new Date(initialData.endAt)
      : addHours(startTime, 1)
  );

  // DateTimePicker表示状態
  const [showStartDate, setShowStartDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // 終了時間が開始時間より前にならないように調整
  useEffect(() => {
    if (endTime <= startTime) {
      setEndTime(addHours(startTime, 1));
    }
  }, [startTime, endTime]);

  const handleStartDateChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowStartDate(false);
    if (date) {
      const newStart = new Date(startTime);
      newStart.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setStartTime(newStart);
    }
  };

  const handleStartTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowStartTime(false);
    if (date) {
      setStartTime(date);
    }
  };

  const handleEndDateChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowEndDate(false);
    if (date) {
      const newEnd = new Date(endTime);
      newEnd.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setEndTime(newEnd);
    }
  };

  const handleEndTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowEndTime(false);
    if (date) {
      setEndTime(date);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      return;
    }

    const finalStartTime = isAllDay ? startOfDay(startTime) : startTime;
    const finalEndTime = isAllDay ? startOfDay(endTime) : endTime;

    await onSubmit({
      title: title.trim(),
      startAt: finalStartTime,
      endAt: finalEndTime,
      isAllDay,
      calendarId,
      categoryId,
      userMemo,
      recurrenceRule: hasRecurrence
        ? { frequency: recurrenceFrequency, interval: recurrenceInterval }
        : null,
    });
  }, [title, startTime, endTime, isAllDay, calendarId, categoryId, userMemo, hasRecurrence, recurrenceFrequency, recurrenceInterval, onSubmit]);

  const frequencyLabels: Record<string, string> = {
    daily: "毎日",
    weekly: "毎週",
    monthly: "毎月",
    yearly: "毎年",
  };

  const selectedCalendar = calendars.find((c) => c.id === calendarId);
  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* タイトル */}
      <View className="mx-4 mt-4 rounded-xl bg-white p-4">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="タイトルを入力"
          placeholderTextColor="#9ca3af"
          className="text-lg font-medium text-gray-900"
          autoFocus
        />
      </View>

      {/* AIで補完ボタン（新規作成時のみ） */}
      {!isEditMode && onAISearch && (
        <View className="mx-4 mt-3">
          <Pressable
            onPress={() => {
              if (title.trim()) {
                onAISearch(title.trim(), startTime);
              }
            }}
            disabled={!title.trim()}
            className={`flex-row items-center justify-center rounded-xl py-3 ${
              title.trim() ? "bg-purple-500 active:bg-purple-600" : "bg-gray-300"
            }`}
          >
            <MaterialIcons name="auto-awesome" size={20} color="#ffffff" />
            <Text className="ml-2 text-white font-semibold">AIで補完</Text>
          </Pressable>
        </View>
      )}

      {/* 終日切替 */}
      <View className="mx-4 mt-3 rounded-xl bg-white p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <MaterialIcons name="wb-sunny" size={24} color="#6b7280" />
            <Text className="ml-3 text-base text-gray-900">終日</Text>
          </View>
          <Switch
            value={isAllDay}
            onValueChange={setIsAllDay}
            trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
            thumbColor={isAllDay ? "#3b82f6" : "#f4f3f4"}
          />
        </View>
      </View>

      {/* 日時 */}
      <View className="mx-4 mt-3 rounded-xl bg-white">
        {/* 開始 */}
        <View className="flex-row items-center border-b border-gray-100 p-4">
          <MaterialIcons name="play-arrow" size={24} color="#6b7280" />
          <Text className="ml-3 w-12 text-sm text-gray-500">開始</Text>
          <Pressable
            onPress={() => setShowStartDate(true)}
            className="ml-2 rounded-lg bg-gray-100 px-3 py-2 active:bg-gray-200"
          >
            <Text className="text-base text-gray-900">
              {format(startTime, "M/d(E)")}
            </Text>
          </Pressable>
          {!isAllDay && (
            <Pressable
              onPress={() => setShowStartTime(true)}
              className="ml-2 rounded-lg bg-gray-100 px-3 py-2 active:bg-gray-200"
            >
              <Text className="text-base text-gray-900">
                {format(startTime, "HH:mm")}
              </Text>
            </Pressable>
          )}
        </View>

        {/* 終了 */}
        <View className="flex-row items-center p-4">
          <MaterialIcons name="stop" size={24} color="#6b7280" />
          <Text className="ml-3 w-12 text-sm text-gray-500">終了</Text>
          <Pressable
            onPress={() => setShowEndDate(true)}
            className="ml-2 rounded-lg bg-gray-100 px-3 py-2 active:bg-gray-200"
          >
            <Text className="text-base text-gray-900">
              {format(endTime, "M/d(E)")}
            </Text>
          </Pressable>
          {!isAllDay && (
            <Pressable
              onPress={() => setShowEndTime(true)}
              className="ml-2 rounded-lg bg-gray-100 px-3 py-2 active:bg-gray-200"
            >
              <Text className="text-base text-gray-900">
                {format(endTime, "HH:mm")}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* カレンダー選択 */}
      <View className="mx-4 mt-3 rounded-xl bg-white">
        <Pressable
          onPress={() => setShowCalendarPicker(!showCalendarPicker)}
          className="flex-row items-center justify-between p-4 active:bg-gray-50"
        >
          <View className="flex-row items-center">
            <MaterialIcons name="event" size={24} color="#6b7280" />
            <Text className="ml-3 text-base text-gray-900">カレンダー</Text>
          </View>
          <View className="flex-row items-center">
            {selectedCalendar && (
              <View
                className="mr-2 h-3 w-3 rounded-full"
                style={{ backgroundColor: selectedCalendar.color || "#3b82f6" }}
              />
            )}
            <Text className="text-gray-600">
              {selectedCalendar?.name || "選択してください"}
            </Text>
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
          </View>
        </Pressable>

        {showCalendarPicker && (
          <View className="border-t border-gray-100 px-4 pb-2">
            {calendars
              .filter((c) => c.role === "owner" || c.role === "editor")
              .map((calendar) => (
                <Pressable
                  key={calendar.id}
                  onPress={() => {
                    setCalendarId(calendar.id);
                    setShowCalendarPicker(false);
                  }}
                  className="flex-row items-center py-3 active:opacity-70"
                >
                  <View
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: calendar.color || "#3b82f6" }}
                  />
                  <Text className="ml-3 flex-1 text-base text-gray-900">
                    {calendar.name}
                  </Text>
                  {calendarId === calendar.id && (
                    <MaterialIcons name="check" size={20} color="#3b82f6" />
                  )}
                </Pressable>
              ))}
          </View>
        )}
      </View>

      {/* カテゴリ選択 */}
      <View className="mx-4 mt-3 rounded-xl bg-white">
        <Pressable
          onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          className="flex-row items-center justify-between p-4 active:bg-gray-50"
        >
          <View className="flex-row items-center">
            <MaterialIcons name="label" size={24} color="#6b7280" />
            <Text className="ml-3 text-base text-gray-900">カテゴリ</Text>
          </View>
          <View className="flex-row items-center">
            {selectedCategory && (
              <View
                className="mr-2 rounded-full px-2 py-0.5"
                style={{ backgroundColor: selectedCategory.color || "#e5e7eb" }}
              >
                <Text className="text-xs text-white">{selectedCategory.name}</Text>
              </View>
            )}
            {!selectedCategory && (
              <Text className="text-gray-500">なし</Text>
            )}
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
          </View>
        </Pressable>

        {showCategoryPicker && (
          <View className="border-t border-gray-100 px-4 pb-2">
            <Pressable
              onPress={() => {
                setCategoryId(null);
                setShowCategoryPicker(false);
              }}
              className="flex-row items-center py-3 active:opacity-70"
            >
              <Text className="flex-1 text-base text-gray-500">なし</Text>
              {categoryId === null && (
                <MaterialIcons name="check" size={20} color="#3b82f6" />
              )}
            </Pressable>
            {categories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => {
                  setCategoryId(category.id);
                  setShowCategoryPicker(false);
                }}
                className="flex-row items-center py-3 active:opacity-70"
              >
                <View
                  className="rounded-full px-2 py-0.5"
                  style={{ backgroundColor: category.color || "#e5e7eb" }}
                >
                  <Text className="text-xs text-white">{category.name}</Text>
                </View>
                <View className="flex-1" />
                {categoryId === category.id && (
                  <MaterialIcons name="check" size={20} color="#3b82f6" />
                )}
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* メモ */}
      <View className="mx-4 mt-3 rounded-xl bg-white p-4">
        <View className="flex-row items-center mb-2">
          <MaterialIcons name="notes" size={24} color="#6b7280" />
          <Text className="ml-3 text-base text-gray-900">メモ</Text>
        </View>
        <TextInput
          value={userMemo}
          onChangeText={setUserMemo}
          placeholder="メモを入力..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
          className="text-base text-gray-900 bg-gray-50 rounded-lg p-3 min-h-[80px]"
          textAlignVertical="top"
        />
      </View>

      {/* 繰り返し設定 */}
      <View className="mx-4 mt-3 rounded-xl bg-white">
        <View className="flex-row items-center justify-between p-4">
          <View className="flex-row items-center">
            <MaterialIcons name="repeat" size={24} color="#6b7280" />
            <Text className="ml-3 text-base text-gray-900">繰り返し</Text>
          </View>
          <Switch
            value={hasRecurrence}
            onValueChange={setHasRecurrence}
            trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
            thumbColor={hasRecurrence ? "#3b82f6" : "#f4f3f4"}
          />
        </View>

        {hasRecurrence && (
          <View className="border-t border-gray-100 px-4 pb-4">
            <Pressable
              onPress={() => setShowRecurrencePicker(!showRecurrencePicker)}
              className="flex-row items-center justify-between py-3 active:opacity-70"
            >
              <Text className="text-sm text-gray-500">頻度</Text>
              <View className="flex-row items-center">
                <Text className="text-base text-gray-900">
                  {recurrenceInterval === 1
                    ? frequencyLabels[recurrenceFrequency]
                    : `${recurrenceInterval}${recurrenceFrequency === "daily" ? "日" : recurrenceFrequency === "weekly" ? "週" : recurrenceFrequency === "monthly" ? "ヶ月" : "年"}ごと`}
                </Text>
                <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
              </View>
            </Pressable>

            {showRecurrencePicker && (
              <View className="border-t border-gray-100 pt-2">
                {(["daily", "weekly", "monthly", "yearly"] as const).map((freq) => (
                  <Pressable
                    key={freq}
                    onPress={() => {
                      setRecurrenceFrequency(freq);
                      setShowRecurrencePicker(false);
                    }}
                    className="flex-row items-center py-2 active:opacity-70"
                  >
                    <Text className="flex-1 text-base text-gray-900">
                      {frequencyLabels[freq]}
                    </Text>
                    {recurrenceFrequency === freq && (
                      <MaterialIcons name="check" size={20} color="#3b82f6" />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* ボタン */}
      <View className="mx-4 mb-8 mt-6 flex-row">
        <Button
          onPress={onCancel}
          variant="secondary"
          className="mr-3 flex-1"
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <Button
          onPress={handleSubmit}
          variant="primary"
          className="flex-1"
          loading={isSubmitting}
          disabled={!title.trim()}
        >
          {initialData ? "更新" : "作成"}
        </Button>
      </View>

      {/* DateTimePickers */}
      {showStartDate && (
        <DateTimePicker
          value={startTime}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleStartDateChange}
          locale="ja"
        />
      )}
      {showStartTime && (
        <DateTimePicker
          value={startTime}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleStartTimeChange}
          minuteInterval={5}
        />
      )}
      {showEndDate && (
        <DateTimePicker
          value={endTime}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleEndDateChange}
          locale="ja"
        />
      )}
      {showEndTime && (
        <DateTimePicker
          value={endTime}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleEndTimeChange}
          minuteInterval={5}
        />
      )}
    </ScrollView>
  );
}

export default ScheduleForm;
