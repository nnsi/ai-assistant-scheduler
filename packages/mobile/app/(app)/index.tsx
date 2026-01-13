/**
 * メインアプリ画面
 * Web版と同じ1画面+モーダル構成
 */
import { useState, useMemo, useCallback } from "react";
import { View, Text, Pressable, Modal, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  useSchedules,
  useCalendarContext,
  useAuth,
  useCategories,
} from "@ai-scheduler/core";
import {
  format,
  getYear,
  getMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns";
import type { Schedule, CreateScheduleInput, UpdateScheduleInput } from "@ai-scheduler/shared";

// Components
import {
  CalendarHeader,
  MonthView,
  WeekView,
  DayView,
  type CalendarViewMode,
} from "../../src/components/calendar";
import { ScheduleForm } from "../../src/components/schedule/ScheduleForm";
import { LoadingSpinner, ErrorMessage } from "../../src/components/ui";

export default function MainApp() {
  const { user, logout } = useAuth();
  const { calendars, selectedCalendarIds, defaultCalendarId, isLoading: calendarsLoading } = useCalendarContext();
  const { categories } = useCategories();

  // View state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCalendarManagementOpen, setIsCalendarManagementOpen] = useState(false);
  const [isConditionsModalOpen, setIsConditionsModalOpen] = useState(false);

  // Schedule state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // 現在の月のスケジュールを取得
  const year = getYear(currentDate);
  const month = getMonth(currentDate) + 1;
  const { schedules, isLoading: schedulesLoading, error, refetch, create, update, remove } = useSchedules(year, month);

  // 選択されたカレンダーのスケジュールのみフィルタ
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => s.calendarId && selectedCalendarIds.includes(s.calendarId));
  }, [schedules, selectedCalendarIds]);

  // ナビゲーション
  const handlePrevious = useCallback(() => {
    switch (viewMode) {
      case "month":
        setCurrentDate((d) => subMonths(d, 1));
        break;
      case "week":
        setCurrentDate((d) => subWeeks(d, 1));
        break;
      case "day":
        setCurrentDate((d) => subDays(d, 1));
        break;
    }
  }, [viewMode]);

  const handleNext = useCallback(() => {
    switch (viewMode) {
      case "month":
        setCurrentDate((d) => addMonths(d, 1));
        break;
      case "week":
        setCurrentDate((d) => addWeeks(d, 1));
        break;
      case "day":
        setCurrentDate((d) => addDays(d, 1));
        break;
    }
  }, [viewMode]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // カレンダーイベント
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setIsEditMode(false);
    setEditingSchedule(null);
    setIsFormModalOpen(true);
  }, []);

  const handleTimeSlotClick = useCallback((date: Date, hour: number) => {
    setSelectedDate(date);
    setSelectedTime(`${hour.toString().padStart(2, "0")}:00`);
    setIsEditMode(false);
    setEditingSchedule(null);
    setIsFormModalOpen(true);
  }, []);

  const handleScheduleClick = useCallback((schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsPopupOpen(true);
  }, []);

  // スケジュール作成/更新
  const handleFormSubmit = useCallback(async (data: {
    title: string;
    startAt: Date;
    endAt: Date;
    isAllDay: boolean;
    calendarId: string;
    categoryId: string | null;
  }) => {
    if (isEditMode && editingSchedule) {
      const updateInput: UpdateScheduleInput = {
        title: data.title,
        startAt: data.startAt.toISOString(),
        endAt: data.endAt.toISOString(),
        isAllDay: data.isAllDay,
        categoryId: data.categoryId || undefined,
      };
      await update(editingSchedule.id, updateInput);
    } else {
      const createInput: CreateScheduleInput = {
        title: data.title,
        startAt: data.startAt.toISOString(),
        endAt: data.endAt.toISOString(),
        isAllDay: data.isAllDay,
        calendarId: data.calendarId,
        categoryId: data.categoryId || undefined,
      };
      await create(createInput);
    }
    refetch();
    setIsFormModalOpen(false);
    setEditingSchedule(null);
    setIsEditMode(false);
  }, [isEditMode, editingSchedule, create, update, refetch]);

  // スケジュール編集
  const handleScheduleEdit = useCallback(() => {
    if (selectedSchedule) {
      setEditingSchedule(selectedSchedule);
      setIsEditMode(true);
      setIsPopupOpen(false);
      setIsFormModalOpen(true);
    }
  }, [selectedSchedule]);

  // スケジュール削除
  const handleScheduleDelete = useCallback(async () => {
    if (selectedSchedule) {
      await remove(selectedSchedule.id);
      refetch();
      setIsPopupOpen(false);
      setSelectedSchedule(null);
    }
  }, [selectedSchedule, remove, refetch]);

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
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* ヘッダー */}
      <View className="bg-white/80 border-b border-gray-200/50 px-4 py-3">
        <View className="flex-row items-center justify-between">
          {/* Logo */}
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-primary-500 items-center justify-center shadow-sm">
              <MaterialIcons name="event" size={20} color="#ffffff" />
            </View>
            <Text className="text-lg font-semibold text-gray-900">
              AI Scheduler
            </Text>
          </View>

          {/* User Menu */}
          {user && (
            <Pressable
              onPress={() => setIsProfileModalOpen(true)}
              className="flex-row items-center gap-2 rounded-xl px-2 py-1.5 active:bg-gray-100"
            >
              {user.picture ? (
                <Image
                  source={{ uri: user.picture }}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center">
                  <Text className="text-sm font-medium text-primary-500">
                    {user.name?.charAt(0) || "?"}
                  </Text>
                </View>
              )}
            </Pressable>
          )}
        </View>
      </View>

      {/* カレンダーヘッダー */}
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
        onViewModeChange={setViewMode}
        onSearchClick={() => setIsSearchModalOpen(true)}
        onCategoryClick={() => setIsCategoryModalOpen(true)}
        onCalendarManageClick={() => setIsCalendarManagementOpen(true)}
        onConditionsClick={() => setIsConditionsModalOpen(true)}
      />

      {/* カレンダー表示 */}
      <View className="flex-1 px-2 py-2">
        {viewMode === "month" && (
          <MonthView
            currentDate={currentDate}
            onDateSelect={handleDateSelect}
            onScheduleClick={handleScheduleClick}
            schedules={filteredSchedules as any}
            calendars={calendars}
            selectedCalendarIds={selectedCalendarIds}
          />
        )}
        {viewMode === "week" && (
          <WeekView
            currentDate={currentDate}
            onTimeSlotClick={handleTimeSlotClick}
            onScheduleClick={handleScheduleClick}
            schedules={filteredSchedules as any}
            calendars={calendars}
            selectedCalendarIds={selectedCalendarIds}
          />
        )}
        {viewMode === "day" && (
          <DayView
            currentDate={currentDate}
            onTimeSlotClick={handleTimeSlotClick}
            onScheduleClick={handleScheduleClick}
            schedules={filteredSchedules as any}
            calendars={calendars}
            selectedCalendarIds={selectedCalendarIds}
          />
        )}
      </View>

      {/* 新規作成ボタン（FAB） */}
      <Pressable
        onPress={() => {
          setSelectedDate(new Date());
          setSelectedTime(null);
          setIsEditMode(false);
          setEditingSchedule(null);
          setIsFormModalOpen(true);
        }}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary-500 items-center justify-center shadow-lg active:bg-primary-600"
      >
        <MaterialIcons name="add" size={28} color="#ffffff" />
      </Pressable>

      {/* スケジュール作成/編集モーダル */}
      <Modal
        visible={isFormModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsFormModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <Pressable onPress={() => setIsFormModalOpen(false)} className="p-2">
              <MaterialIcons name="close" size={24} color="#374151" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-900">
              {isEditMode ? "予定を編集" : "新しい予定"}
            </Text>
            <View className="w-10" />
          </View>
          <ScheduleForm
            initialData={editingSchedule || undefined}
            initialDate={selectedDate || undefined}
            calendars={calendars.filter((c) => c.role === "owner" || c.role === "editor")}
            categories={categories}
            defaultCalendarId={defaultCalendarId}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormModalOpen(false)}
            isSubmitting={false}
          />
        </SafeAreaView>
      </Modal>

      {/* スケジュール詳細モーダル */}
      <Modal
        visible={isPopupOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPopupOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <Pressable onPress={() => setIsPopupOpen(false)} className="p-2">
              <MaterialIcons name="close" size={24} color="#374151" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-900">予定詳細</Text>
            <View className="flex-row">
              <Pressable onPress={handleScheduleEdit} className="p-2">
                <MaterialIcons name="edit" size={24} color="#3b82f6" />
              </Pressable>
              <Pressable onPress={handleScheduleDelete} className="p-2">
                <MaterialIcons name="delete" size={24} color="#ef4444" />
              </Pressable>
            </View>
          </View>
          {selectedSchedule && (
            <View className="p-4">
              <Text className="text-2xl font-bold text-gray-900 mb-4">
                {selectedSchedule.title}
              </Text>
              <View className="flex-row items-center mb-3">
                <MaterialIcons name="access-time" size={20} color="#6b7280" />
                <Text className="ml-2 text-gray-600">
                  {format(new Date(selectedSchedule.startAt), "yyyy/M/d HH:mm")}
                  {selectedSchedule.endAt && (
                    <> 〜 {format(new Date(selectedSchedule.endAt), "HH:mm")}</>
                  )}
                </Text>
              </View>
              {selectedSchedule.isAllDay && (
                <View className="flex-row items-center mb-3">
                  <MaterialIcons name="wb-sunny" size={20} color="#6b7280" />
                  <Text className="ml-2 text-gray-600">終日</Text>
                </View>
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* プロフィールモーダル */}
      <Modal
        visible={isProfileModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsProfileModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <Pressable onPress={() => setIsProfileModalOpen(false)} className="p-2">
              <MaterialIcons name="close" size={24} color="#374151" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-900">プロフィール</Text>
            <View className="w-10" />
          </View>
          <View className="p-4">
            {user && (
              <View className="items-center mb-6">
                {user.picture ? (
                  <Image
                    source={{ uri: user.picture }}
                    className="w-20 h-20 rounded-full mb-3"
                  />
                ) : (
                  <View className="w-20 h-20 rounded-full bg-primary-100 items-center justify-center mb-3">
                    <Text className="text-3xl font-bold text-primary-500">
                      {user.name?.charAt(0) || "?"}
                    </Text>
                  </View>
                )}
                <Text className="text-xl font-semibold text-gray-900">{user.name}</Text>
                <Text className="text-gray-500">{user.email}</Text>
              </View>
            )}
            <Pressable
              onPress={() => {
                setIsProfileModalOpen(false);
                logout();
              }}
              className="flex-row items-center justify-center bg-red-500 rounded-xl py-3 active:bg-red-600"
            >
              <MaterialIcons name="logout" size={20} color="#ffffff" />
              <Text className="ml-2 text-white font-semibold">ログアウト</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* AI検索モーダル（簡易版） */}
      <Modal
        visible={isSearchModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsSearchModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <Pressable onPress={() => setIsSearchModalOpen(false)} className="p-2">
              <MaterialIcons name="close" size={24} color="#374151" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-900">AI検索</Text>
            <View className="w-10" />
          </View>
          <View className="flex-1 items-center justify-center p-4">
            <MaterialIcons name="search" size={64} color="#d1d5db" />
            <Text className="text-gray-500 mt-4 text-center">
              AI検索機能は準備中です
            </Text>
          </View>
        </SafeAreaView>
      </Modal>

      {/* カテゴリモーダル（簡易版） */}
      <Modal
        visible={isCategoryModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsCategoryModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <Pressable onPress={() => setIsCategoryModalOpen(false)} className="p-2">
              <MaterialIcons name="close" size={24} color="#374151" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-900">カテゴリ</Text>
            <View className="w-10" />
          </View>
          <View className="p-4">
            {categories.length === 0 ? (
              <Text className="text-gray-500 text-center">カテゴリがありません</Text>
            ) : (
              categories.map((cat) => (
                <View key={cat.id} className="flex-row items-center py-3 border-b border-gray-100">
                  <View
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: cat.color || "#3b82f6" }}
                  />
                  <Text className="text-gray-900">{cat.name}</Text>
                </View>
              ))
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* カレンダー管理モーダル（簡易版） */}
      <Modal
        visible={isCalendarManagementOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsCalendarManagementOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <Pressable onPress={() => setIsCalendarManagementOpen(false)} className="p-2">
              <MaterialIcons name="close" size={24} color="#374151" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-900">カレンダー</Text>
            <View className="w-10" />
          </View>
          <View className="p-4">
            {calendars.map((cal) => (
              <View key={cal.id} className="flex-row items-center py-3 border-b border-gray-100">
                <View
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: cal.color || "#3b82f6" }}
                />
                <Text className="flex-1 text-gray-900">{cal.name}</Text>
                <Text className="text-xs text-gray-500">{cal.role}</Text>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      {/* こだわり条件モーダル（簡易版） */}
      <Modal
        visible={isConditionsModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsConditionsModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <Pressable onPress={() => setIsConditionsModalOpen(false)} className="p-2">
              <MaterialIcons name="close" size={24} color="#374151" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-900">こだわり条件</Text>
            <View className="w-10" />
          </View>
          <View className="flex-1 items-center justify-center p-4">
            <MaterialIcons name="tune" size={64} color="#d1d5db" />
            <Text className="text-gray-500 mt-4 text-center">
              こだわり条件設定は準備中です
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
