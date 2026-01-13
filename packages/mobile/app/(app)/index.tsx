/**
 * メインアプリ画面
 * Web版と同じ1画面+モーダル構成
 */
import { useState, useMemo, useCallback } from "react";
import { View, Text, Pressable, Modal, Image, ActivityIndicator, ScrollView, Alert, TextInput, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  useSchedules,
  useCalendarContext,
  useAuth,
  useCategories,
  useAI,
  useProfile,
  useCreateCalendar,
  useScheduleSearch,
  toAppError,
  fetchScheduleById,
} from "@ai-scheduler/core";
import { useQuery } from "@tanstack/react-query";
import type { SearchScheduleInput } from "@ai-scheduler/shared";
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
  addHours,
} from "date-fns";
import { ja } from "date-fns/locale";
import type { Schedule, CreateScheduleInput, UpdateScheduleInput, ScheduleWithSupplement } from "@ai-scheduler/shared";

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
  const { user, logout, updateEmail } = useAuth();
  const {
    calendars,
    selectedCalendarIds,
    defaultCalendarId,
    isLoading: calendarsLoading,
    toggleCalendar,
    selectAllCalendars,
    setDefaultCalendar,
  } = useCalendarContext();
  const { mutateAsync: createCalendarAsync, isPending: isCreatingCalendar } = useCreateCalendar();
  const { categories, create: createCategory, remove: removeCategory } = useCategories();
  const { profile, updateConditions, isLoading: isProfileLoading } = useProfile();
  const {
    keywords,
    searchResult,
    isLoadingKeywords,
    isStreaming,
    statusMessage,
    suggestKeywords,
    regenerateKeywords,
    searchAndSaveStream,
    abortStream,
    reset: resetAI,
  } = useAI();

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

  // AI search state
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  const [isSearchResultModalOpen, setIsSearchResultModalOpen] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [aiSearchTitle, setAISearchTitle] = useState("");
  const [aiSearchStartAt, setAISearchStartAt] = useState<Date>(new Date());
  const [pendingScheduleId, setPendingScheduleId] = useState<string | null>(null);

  // こだわり条件設定 state
  const [conditionsRequired, setConditionsRequired] = useState(profile?.requiredConditions || "");
  const [conditionsPreferred, setConditionsPreferred] = useState(profile?.preferredConditions || "");
  const [conditionsImportant, setConditionsImportant] = useState(profile?.subjectiveConditions || "");

  // カテゴリ管理 state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3B82F6");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // カレンダー管理 state
  const [showCalendarForm, setShowCalendarForm] = useState(false);
  const [showDefaultPicker, setShowDefaultPicker] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");

  // その他メニュー state
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // プロフィール設定 state
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // 予定検索 state
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchStartDate, setSearchStartDate] = useState<Date | null>(null);
  const [searchEndDate, setSearchEndDate] = useState<Date | null>(null);
  const [searchCategoryId, setSearchCategoryId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Schedule[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 現在の月のスケジュールを取得
  const year = getYear(currentDate);
  const month = getMonth(currentDate) + 1;
  const { schedules, isLoading: schedulesLoading, error, refetch, create, update, remove } = useSchedules(year, month);

  // スケジュール詳細を取得（supplement含む）
  const { data: fullSchedule } = useQuery({
    queryKey: ["schedule", selectedSchedule?.id],
    queryFn: () => fetchScheduleById(selectedSchedule!.id),
    enabled: !!selectedSchedule?.id && isPopupOpen,
  });

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
    userMemo: string;
    recurrenceRule: { frequency: "daily" | "weekly" | "monthly" | "yearly"; interval: number } | null;
  }) => {
    if (isEditMode && editingSchedule) {
      const updateInput: UpdateScheduleInput = {
        title: data.title,
        startAt: data.startAt.toISOString(),
        endAt: data.endAt.toISOString(),
        isAllDay: data.isAllDay,
        categoryId: data.categoryId || undefined,
        userMemo: data.userMemo || undefined,
        recurrenceRule: data.recurrenceRule || undefined,
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
        userMemo: data.userMemo || undefined,
        recurrenceRule: data.recurrenceRule || undefined,
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

  // スケジュール削除（確認ダイアログ付き）
  const handleScheduleDelete = useCallback(() => {
    if (selectedSchedule) {
      Alert.alert(
        "予定を削除",
        `「${selectedSchedule.title}」を削除しますか？`,
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "削除",
            style: "destructive",
            onPress: async () => {
              await remove(selectedSchedule.id);
              refetch();
              setIsPopupOpen(false);
              setSelectedSchedule(null);
            },
          },
        ]
      );
    }
  }, [selectedSchedule, remove, refetch]);

  // AI検索結果の展開状態
  const [showAIResult, setShowAIResult] = useState(false);

  // AI検索開始（フォームから呼ばれる）
  const handleAISearch = useCallback(async (title: string, startAt: Date) => {
    setAISearchTitle(title);
    setAISearchStartAt(startAt);
    setSelectedKeywords([]);
    resetAI();

    // こだわり条件のコンテキストを作成
    const scheduleContext = profile ? {
      requiredConditions: profile.requiredConditions || undefined,
      preferredConditions: profile.preferredConditions || undefined,
      subjectiveConditions: profile.subjectiveConditions || undefined,
    } : undefined;

    // キーワード提案を取得
    await suggestKeywords(title, startAt.toISOString(), undefined, scheduleContext);
    setIsKeywordModalOpen(true);
  }, [profile, suggestKeywords, resetAI]);

  // キーワード再生成
  const handleRegenerateKeywords = useCallback(async () => {
    const scheduleContext = profile ? {
      requiredConditions: profile.requiredConditions || undefined,
      preferredConditions: profile.preferredConditions || undefined,
      subjectiveConditions: profile.subjectiveConditions || undefined,
    } : undefined;
    await regenerateKeywords(aiSearchTitle, aiSearchStartAt.toISOString(), scheduleContext);
  }, [profile, aiSearchTitle, aiSearchStartAt, regenerateKeywords]);

  // キーワード選択切り替え
  const toggleKeyword = useCallback((keyword: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword]
    );
  }, []);

  // AI検索実行
  const handleExecuteSearch = useCallback(async () => {
    // カレンダーIDを取得
    const calendarId = defaultCalendarId || calendars[0]?.id;
    if (!calendarId) {
      Alert.alert("エラー", "カレンダーが見つかりません。先にカレンダーを作成してください。");
      return;
    }

    // まずスケジュールを作成
    const createInput: CreateScheduleInput = {
      title: aiSearchTitle,
      startAt: aiSearchStartAt.toISOString(),
      endAt: addHours(aiSearchStartAt, 1).toISOString(),
      isAllDay: false,
      calendarId,
    };
    const newSchedule = await create(createInput);

    if (newSchedule?.id) {
      setPendingScheduleId(newSchedule.id);
      setIsKeywordModalOpen(false);
      setIsSearchResultModalOpen(true);

      // こだわり条件のコンテキストを作成
      const scheduleContext = profile ? {
        requiredConditions: profile.requiredConditions || undefined,
        preferredConditions: profile.preferredConditions || undefined,
        subjectiveConditions: profile.subjectiveConditions || undefined,
      } : undefined;

      // ストリーミング検索実行
      await searchAndSaveStream(
        newSchedule.id,
        aiSearchTitle,
        aiSearchStartAt.toISOString(),
        selectedKeywords,
        scheduleContext
      );
    }
  }, [aiSearchTitle, aiSearchStartAt, defaultCalendarId, calendars, create, profile, selectedKeywords, searchAndSaveStream]);

  // AI検索をスキップ
  const handleSkipSearch = useCallback(async () => {
    // カレンダーIDを取得
    const calendarId = defaultCalendarId || calendars[0]?.id;
    if (!calendarId) {
      Alert.alert("エラー", "カレンダーが見つかりません。先にカレンダーを作成してください。");
      return;
    }

    setIsKeywordModalOpen(false);
    // スケジュールを作成して閉じる
    const createInput: CreateScheduleInput = {
      title: aiSearchTitle,
      startAt: aiSearchStartAt.toISOString(),
      endAt: addHours(aiSearchStartAt, 1).toISOString(),
      isAllDay: false,
      calendarId,
    };
    await create(createInput);
    refetch();
    setIsFormModalOpen(false);
  }, [aiSearchTitle, aiSearchStartAt, defaultCalendarId, calendars, create, refetch]);

  // 検索結果画面を閉じる
  const handleCloseSearchResult = useCallback(() => {
    abortStream();
    setIsSearchResultModalOpen(false);
    setIsFormModalOpen(false);
    setPendingScheduleId(null);
    refetch();
  }, [abortStream, refetch]);

  // こだわり条件モーダルを開く
  const handleOpenConditions = useCallback(() => {
    setConditionsRequired(profile?.requiredConditions || "");
    setConditionsPreferred(profile?.preferredConditions || "");
    setConditionsImportant(profile?.subjectiveConditions || "");
    setIsConditionsModalOpen(true);
  }, [profile]);

  // こだわり条件を保存
  const [isSavingConditions, setIsSavingConditions] = useState(false);
  const handleSaveConditions = useCallback(async () => {
    setIsSavingConditions(true);
    try {
      await updateConditions({
        requiredConditions: conditionsRequired || null,
        preferredConditions: conditionsPreferred || null,
        subjectiveConditions: conditionsImportant || null,
      });
      setIsConditionsModalOpen(false);
    } catch (error) {
      Alert.alert("エラー", "こだわり条件の保存に失敗しました");
    } finally {
      setIsSavingConditions(false);
    }
  }, [conditionsRequired, conditionsPreferred, conditionsImportant, updateConditions]);

  // カテゴリ作成
  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;
    setIsSavingCategory(true);
    try {
      await createCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
      });
      setNewCategoryName("");
      setNewCategoryColor("#3B82F6");
      setShowCategoryForm(false);
    } catch (error) {
      Alert.alert("エラー", "カテゴリの作成に失敗しました");
    } finally {
      setIsSavingCategory(false);
    }
  }, [newCategoryName, newCategoryColor, createCategory]);

  // カテゴリ削除
  const handleDeleteCategory = useCallback((categoryId: string, categoryName: string) => {
    Alert.alert(
      "カテゴリを削除",
      `「${categoryName}」を削除しますか？`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            try {
              await removeCategory(categoryId);
            } catch (error) {
              Alert.alert("エラー", "カテゴリの削除に失敗しました");
            }
          },
        },
      ]
    );
  }, [removeCategory]);

  // カラーパレット
  const categoryColors = [
    "#EF4444", "#F97316", "#F59E0B", "#84CC16",
    "#22C55E", "#14B8A6", "#06B6D4", "#3B82F6",
    "#6366F1", "#8B5CF6", "#A855F7", "#EC4899",
  ];

  // カレンダー作成
  const handleCreateCalendar = useCallback(async () => {
    if (!newCalendarName.trim()) return;
    try {
      await createCalendarAsync({
        name: newCalendarName.trim(),
      });
      setNewCalendarName("");
      setShowCalendarForm(false);
    } catch (error) {
      Alert.alert("エラー", "カレンダーの作成に失敗しました");
    }
  }, [newCalendarName, createCalendarAsync]);

  // 予定検索実行
  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    try {
      // 検索条件を構築
      const params: SearchScheduleInput = {};
      if (searchKeyword.trim()) {
        params.query = searchKeyword.trim();
      }
      if (searchStartDate) {
        params.startDate = format(searchStartDate, "yyyy-MM-dd");
      }
      if (searchEndDate) {
        params.endDate = format(searchEndDate, "yyyy-MM-dd");
      }
      if (searchCategoryId) {
        params.categoryId = searchCategoryId;
      }

      // APIを直接呼び出す（useScheduleSearchはuseQuery用なので）
      const { searchSchedules } = await import("@ai-scheduler/core");
      // @ts-ignore - searchSchedules might not be directly exported
      const results = filteredSchedules.filter((schedule) => {
        let matches = true;
        if (params.query) {
          const query = params.query.toLowerCase();
          matches = matches && (
            schedule.title.toLowerCase().includes(query) ||
            (schedule.userMemo && schedule.userMemo.toLowerCase().includes(query))
          );
        }
        if (params.categoryId) {
          matches = matches && schedule.categoryId === params.categoryId;
        }
        if (params.startDate) {
          matches = matches && new Date(schedule.startAt) >= new Date(params.startDate);
        }
        if (params.endDate) {
          matches = matches && new Date(schedule.startAt) <= new Date(params.endDate + "T23:59:59");
        }
        return matches;
      });
      setSearchResults(results);
    } catch (error) {
      Alert.alert("エラー", "検索に失敗しました");
    } finally {
      setIsSearching(false);
    }
  }, [searchKeyword, searchStartDate, searchEndDate, searchCategoryId, filteredSchedules]);

  // 検索条件クリア
  const handleClearSearch = useCallback(() => {
    setSearchKeyword("");
    setSearchStartDate(null);
    setSearchEndDate(null);
    setSearchCategoryId(null);
    setSearchResults([]);
  }, []);

  const isLoading = calendarsLoading || schedulesLoading;

  if (isLoading && schedules.length === 0) {
    return <LoadingSpinner fullScreen message="読み込み中..." />;
  }

  if (error) {
    const appError = toAppError(error);
    const isAuthError = appError.code === "AUTH_ERROR";

    return (
      <ErrorMessage
        fullScreen
        message={isAuthError
          ? "セッションが切れました。再度ログインしてください。"
          : "スケジュールの読み込みに失敗しました"
        }
        isAuthError={isAuthError}
        onLogin={isAuthError ? logout : undefined}
        onRetry={!isAuthError ? refetch : undefined}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* 統合ヘッダー - 1段に集約 */}
      <View className="bg-white px-2 py-1.5 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          {/* 左: 日付ナビゲーション */}
          <View className="flex-row items-center">
            <Pressable
              onPress={handlePrevious}
              className="w-9 h-9 items-center justify-center rounded-full active:bg-gray-100"
            >
              <MaterialIcons name="chevron-left" size={26} color="#374151" />
            </Pressable>
            <Pressable
              onPress={handleToday}
              className="px-1.5 py-1 active:bg-gray-100 rounded-lg"
            >
              <Text className="text-base font-bold text-gray-900">
                {viewMode === "month" && format(currentDate, "yyyy年M月", { locale: ja })}
                {viewMode === "week" && (() => {
                  const weekStart = new Date(currentDate);
                  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
                  const weekEnd = new Date(weekStart);
                  weekEnd.setDate(weekStart.getDate() + 6);
                  if (weekStart.getMonth() === weekEnd.getMonth()) {
                    return format(weekStart, "M/d", { locale: ja }) + "〜" + format(weekEnd, "d", { locale: ja });
                  }
                  return format(weekStart, "M/d", { locale: ja }) + "〜" + format(weekEnd, "M/d", { locale: ja });
                })()}
                {viewMode === "day" && format(currentDate, "M/d(E)", { locale: ja })}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleNext}
              className="w-9 h-9 items-center justify-center rounded-full active:bg-gray-100"
            >
              <MaterialIcons name="chevron-right" size={26} color="#374151" />
            </Pressable>
          </View>

          {/* 中央: 表示モード切替 */}
          <View className="flex-row bg-gray-100 rounded-lg p-0.5">
            {[
              { mode: "month" as const, label: "月" },
              { mode: "week" as const, label: "週" },
              { mode: "day" as const, label: "日" },
            ].map(({ mode, label }) => (
              <Pressable
                key={mode}
                onPress={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-md ${
                  viewMode === mode ? "bg-white shadow-sm" : ""
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    viewMode === mode ? "text-primary-500" : "text-gray-500"
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* 右: ツールボタン + プロフィール */}
          <View className="flex-row items-center">
            <Pressable
              onPress={() => setIsSearchModalOpen(true)}
              className="w-9 h-9 items-center justify-center rounded-full active:bg-gray-100"
            >
              <MaterialIcons name="search" size={22} color="#6b7280" />
            </Pressable>
            <Pressable
              onPress={() => setIsMoreMenuOpen(true)}
              className="w-9 h-9 items-center justify-center rounded-full active:bg-gray-100"
            >
              <MaterialIcons name="more-vert" size={22} color="#6b7280" />
            </Pressable>
            {user && (
              <Pressable
                onPress={() => setIsProfileModalOpen(true)}
                className="w-9 h-9 items-center justify-center rounded-full active:bg-gray-100 ml-0.5"
              >
                {user.picture ? (
                  <Image
                    source={{ uri: user.picture }}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center">
                    <Text className="text-xs font-bold text-primary-500">
                      {user.name?.charAt(0) || "?"}
                    </Text>
                  </View>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* カレンダー表示 */}
      <View className="flex-1 p-2">
        {viewMode === "month" && (
          <MonthView
            currentDate={currentDate}
            onDateSelect={handleDateSelect}
            onScheduleClick={handleScheduleClick}
            schedules={filteredSchedules as any}
            calendars={calendars}
            categories={categories}
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
            categories={categories}
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
            categories={categories}
            selectedCalendarIds={selectedCalendarIds}
          />
        )}
      </View>

      {/* 新規作成ボタン（FAB）- 視認性向上 */}
      <Pressable
        onPress={() => {
          setSelectedDate(new Date());
          setSelectedTime(null);
          setIsEditMode(false);
          setEditingSchedule(null);
          setIsFormModalOpen(true);
        }}
        className="absolute bottom-5 right-4 w-14 h-14 rounded-full bg-primary-500 items-center justify-center active:bg-primary-600"
        style={{
          shadowColor: "#f97316",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.35,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <MaterialIcons name="add" size={28} color="#ffffff" />
      </Pressable>

      {/* スケジュール作成/編集モーダル */}
      <Modal
        visible={isFormModalOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsFormModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between bg-white px-2 py-2">
            <Pressable
              onPress={() => setIsFormModalOpen(false)}
              className="w-10 h-10 items-center justify-center rounded-full active:bg-gray-100"
            >
              <MaterialIcons name="close" size={24} color="#374151" />
            </Pressable>
            <Text className="text-base font-semibold text-gray-900">
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
            onAISearch={handleAISearch}
            isSubmitting={false}
            isEditMode={isEditMode}
          />
        </SafeAreaView>
      </Modal>

      {/* スケジュール詳細モーダル - 情報充実 */}
      <Modal
        visible={isPopupOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setIsPopupOpen(false);
          setShowAIResult(false);
        }}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          {/* ヘッダー */}
          <View className="flex-row items-center justify-between bg-white px-2 py-2">
            <Pressable
              onPress={() => { setIsPopupOpen(false); setShowAIResult(false); }}
              className="w-10 h-10 items-center justify-center rounded-full active:bg-gray-100"
            >
              <MaterialIcons name="close" size={24} color="#374151" />
            </Pressable>
            <Text className="text-base font-semibold text-gray-900">予定詳細</Text>
            <View className="flex-row">
              <Pressable onPress={handleScheduleEdit} className="w-10 h-10 items-center justify-center rounded-full active:bg-gray-100">
                <MaterialIcons name="edit" size={22} color="#3b82f6" />
              </Pressable>
              <Pressable onPress={handleScheduleDelete} className="w-10 h-10 items-center justify-center rounded-full active:bg-gray-100">
                <MaterialIcons name="delete" size={22} color="#ef4444" />
              </Pressable>
            </View>
          </View>

          {selectedSchedule && (
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {/* タイトルカード */}
              <View className="bg-white px-4 py-4 border-b border-gray-100">
                {/* カテゴリバッジ */}
                {selectedSchedule.categoryId && (() => {
                  const category = categories.find(c => c.id === selectedSchedule.categoryId);
                  return category ? (
                    <View
                      className="self-start rounded-full px-2.5 py-1 mb-2"
                      style={{ backgroundColor: category.color || "#3b82f6" }}
                    >
                      <Text className="text-xs text-white font-medium">{category.name}</Text>
                    </View>
                  ) : null;
                })()}

                <Text className="text-xl font-bold text-gray-900">
                  {selectedSchedule.title}
                </Text>
              </View>

              {/* 日時情報カード */}
              <View className="bg-white mt-2 px-4 py-3">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
                    <MaterialIcons name="schedule" size={20} color="#3b82f6" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-sm text-gray-500">日時</Text>
                    <Text className="text-base text-gray-900 font-medium">
                      {selectedSchedule.isAllDay
                        ? format(new Date(selectedSchedule.startAt), "yyyy年M月d日(E)", { locale: ja }) + " 終日"
                        : format(new Date(selectedSchedule.startAt), "yyyy年M月d日(E) HH:mm", { locale: ja }) +
                          (selectedSchedule.endAt ? ` 〜 ${format(new Date(selectedSchedule.endAt), "HH:mm")}` : "")}
                    </Text>
                  </View>
                </View>

                {/* 繰り返し */}
                {selectedSchedule.recurrence && (
                  <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                    <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center">
                      <MaterialIcons name="repeat" size={20} color="#8b5cf6" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-sm text-gray-500">繰り返し</Text>
                      <Text className="text-base text-gray-900 font-medium">
                        {selectedSchedule.recurrence.frequency === "daily" && "毎日"}
                        {selectedSchedule.recurrence.frequency === "weekly" && "毎週"}
                        {selectedSchedule.recurrence.frequency === "monthly" && "毎月"}
                        {selectedSchedule.recurrence.frequency === "yearly" && "毎年"}
                      </Text>
                    </View>
                  </View>
                )}

                {/* カレンダー */}
                {selectedSchedule.calendarId && (() => {
                  const calendar = calendars.find(c => c.id === selectedSchedule.calendarId);
                  return calendar ? (
                    <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                      <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                        <View className="w-4 h-4 rounded-full" style={{ backgroundColor: calendar.color || "#3b82f6" }} />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-sm text-gray-500">カレンダー</Text>
                        <Text className="text-base text-gray-900 font-medium">{calendar.name}</Text>
                      </View>
                    </View>
                  ) : null;
                })()}

                {/* カテゴリ */}
                {selectedSchedule.categoryId && (() => {
                  const category = categories.find(c => c.id === selectedSchedule.categoryId);
                  return category ? (
                    <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                      <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: `${category.color}20` || "#3b82f620" }}>
                        <MaterialIcons name="label" size={20} color={category.color || "#3b82f6"} />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-sm text-gray-500">カテゴリ</Text>
                        <View className="flex-row items-center mt-0.5">
                          <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: category.color || "#3b82f6" }}>
                            <Text className="text-xs text-white font-medium">{category.name}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ) : null;
                })()}
              </View>

              {/* メモ */}
              {fullSchedule?.supplement?.userMemo && (
                <View className="bg-white mt-2 px-4 py-3">
                  <View className="flex-row items-start">
                    <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center">
                      <MaterialIcons name="notes" size={20} color="#f59e0b" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-sm text-gray-500 mb-1">メモ</Text>
                      <Text className="text-base text-gray-700 leading-6">{fullSchedule.supplement.userMemo}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* 選択した店舗 */}
              {fullSchedule?.supplement?.selectedShops && fullSchedule.supplement.selectedShops.length > 0 && (
                <View className="bg-white mt-2 px-4 py-3">
                  <View className="flex-row items-center mb-3">
                    <View className="w-10 h-10 rounded-full bg-rose-50 items-center justify-center">
                      <MaterialIcons name="store" size={20} color="#f43f5e" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-sm text-gray-500">選択した店舗</Text>
                    </View>
                  </View>
                  <View className="gap-3">
                    {fullSchedule.supplement.selectedShops.map((shop, index) => (
                      <View key={index} className="bg-gray-50 rounded-xl p-3">
                        <Text className="text-base font-semibold text-gray-900 mb-1">{shop.name}</Text>
                        {shop.summary && (
                          <Text className="text-sm text-gray-600 mb-2">{shop.summary}</Text>
                        )}
                        {shop.address && (
                          <View className="flex-row items-center mb-1">
                            <MaterialIcons name="place" size={14} color="#9ca3af" />
                            <Text className="text-xs text-gray-500 ml-1 flex-1">{shop.address}</Text>
                          </View>
                        )}
                        {shop.businessHours && (
                          <View className="flex-row items-center mb-1">
                            <MaterialIcons name="schedule" size={14} color="#9ca3af" />
                            <Text className="text-xs text-gray-500 ml-1">{shop.businessHours}</Text>
                          </View>
                        )}
                        {shop.urls && (
                          <View className="flex-row flex-wrap gap-2 mt-2">
                            {shop.urls.official && (
                              <Pressable
                                onPress={() => Linking.openURL(shop.urls!.official!)}
                                className="bg-blue-100 px-2 py-1 rounded"
                              >
                                <Text className="text-xs text-blue-700 font-medium">公式サイト</Text>
                              </Pressable>
                            )}
                            {shop.urls.reservation && (
                              <Pressable
                                onPress={() => Linking.openURL(shop.urls!.reservation!)}
                                className="bg-green-100 px-2 py-1 rounded"
                              >
                                <Text className="text-xs text-green-700 font-medium">予約</Text>
                              </Pressable>
                            )}
                            {shop.urls.tabelog && (
                              <Pressable
                                onPress={() => Linking.openURL(shop.urls!.tabelog!)}
                                className="bg-orange-100 px-2 py-1 rounded"
                              >
                                <Text className="text-xs text-orange-700 font-medium">食べログ</Text>
                              </Pressable>
                            )}
                            {shop.urls.googleMap && (
                              <Pressable
                                onPress={() => Linking.openURL(shop.urls!.googleMap!)}
                                className="bg-red-100 px-2 py-1 rounded"
                              >
                                <Text className="text-xs text-red-700 font-medium">地図</Text>
                              </Pressable>
                            )}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* AI検索結果 */}
              {fullSchedule?.supplement?.aiResult && (
                <View className="bg-white mt-2 overflow-hidden">
                  <Pressable
                    onPress={() => setShowAIResult(!showAIResult)}
                    className="flex-row items-center px-4 py-3 active:bg-gray-50"
                  >
                    <View className="w-10 h-10 rounded-full bg-gradient-to-r bg-primary-50 items-center justify-center">
                      <MaterialIcons name="auto-awesome" size={20} color="#f97316" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-sm text-gray-500">AI検索結果</Text>
                      <Text className="text-base text-gray-900 font-medium">タップして{showAIResult ? "閉じる" : "表示"}</Text>
                    </View>
                    <MaterialIcons
                      name={showAIResult ? "expand-less" : "expand-more"}
                      size={24}
                      color="#9ca3af"
                    />
                  </Pressable>
                  {showAIResult && (
                    <View className="px-4 pb-4 pt-2 bg-gray-50 mx-4 mb-4 rounded-xl">
                      <Text className="text-gray-700 text-sm leading-6">
                        {fullSchedule.supplement.aiResult}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* 下部の余白 */}
              <View className="h-8" />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* プロフィールモーダル */}
      <Modal
        visible={isProfileModalOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsProfileModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <Pressable onPress={() => setIsProfileModalOpen(false)} className="p-2">
              <MaterialIcons name="close" size={24} color="#374151" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-900">プロフィール設定</Text>
            <View className="w-10" />
          </View>
          <ScrollView className="flex-1 p-4">
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

            {/* メールアドレス更新 */}
            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">メールアドレス</Text>
              <TextInput
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="example@email.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                className="text-base text-gray-900 bg-gray-50 rounded-lg p-3 mb-3"
              />
              <Pressable
                onPress={async () => {
                  if (!editEmail.trim() || editEmail === user?.email) return;
                  setIsUpdatingEmail(true);
                  try {
                    await updateEmail(editEmail.trim());
                    Alert.alert("成功", "メールアドレスを更新しました");
                  } catch (error) {
                    Alert.alert("エラー", "メールアドレスの更新に失敗しました");
                  } finally {
                    setIsUpdatingEmail(false);
                  }
                }}
                disabled={!editEmail.trim() || editEmail === user?.email || isUpdatingEmail}
                className={`rounded-xl py-2 ${
                  editEmail.trim() && editEmail !== user?.email
                    ? "bg-primary-500 active:bg-primary-600"
                    : "bg-gray-300"
                }`}
              >
                {isUpdatingEmail ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-center text-white font-medium">メールアドレスを更新</Text>
                )}
              </Pressable>
            </View>

            {/* Google連携セクション */}
            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Googleアカウント連携</Text>
              <Text className="text-xs text-gray-500 mb-3">
                別のGoogleアカウントに紐づけ直すことができます。
              </Text>
              <Pressable
                onPress={() => {
                  Alert.alert(
                    "Googleアカウントを再設定",
                    "一度ログアウトして、新しいGoogleアカウントでログインしてください。",
                    [
                      { text: "キャンセル", style: "cancel" },
                      {
                        text: "ログアウトして再設定",
                        onPress: () => {
                          setIsProfileModalOpen(false);
                          logout();
                        },
                      },
                    ]
                  );
                }}
                className="flex-row items-center justify-center border border-gray-300 rounded-xl py-2 active:bg-gray-50"
              >
                <MaterialIcons name="link" size={18} color="#6b7280" />
                <Text className="ml-2 text-gray-700 font-medium">Googleアカウントを再設定</Text>
              </Pressable>
            </View>

            {/* ログアウト */}
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
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 予定検索モーダル */}
      <Modal
        visible={isSearchModalOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setIsSearchModalOpen(false);
          handleClearSearch();
        }}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <Pressable onPress={() => {
              setIsSearchModalOpen(false);
              handleClearSearch();
            }} className="p-2">
              <MaterialIcons name="close" size={24} color="#374151" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-900">予定を検索</Text>
            <View className="w-10" />
          </View>

          <ScrollView className="flex-1 p-4">
            {/* キーワード入力 */}
            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">キーワード</Text>
              <TextInput
                value={searchKeyword}
                onChangeText={setSearchKeyword}
                placeholder="タイトルやメモで検索"
                placeholderTextColor="#9ca3af"
                className="text-base text-gray-900 bg-gray-50 rounded-lg p-3"
              />
            </View>

            {/* 日付範囲 */}
            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-3">日付範囲</Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    // 開始日ピッカーを表示するためにstateを設定
                    const today = new Date();
                    setSearchStartDate(searchStartDate || today);
                  }}
                  className="flex-1 bg-gray-50 rounded-lg p-3"
                >
                  <Text className="text-xs text-gray-500 mb-1">開始日</Text>
                  <Text className={searchStartDate ? "text-gray-900" : "text-gray-400"}>
                    {searchStartDate ? format(searchStartDate, "yyyy/MM/dd") : "指定なし"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const today = new Date();
                    setSearchEndDate(searchEndDate || today);
                  }}
                  className="flex-1 bg-gray-50 rounded-lg p-3"
                >
                  <Text className="text-xs text-gray-500 mb-1">終了日</Text>
                  <Text className={searchEndDate ? "text-gray-900" : "text-gray-400"}>
                    {searchEndDate ? format(searchEndDate, "yyyy/MM/dd") : "指定なし"}
                  </Text>
                </Pressable>
              </View>
              {(searchStartDate || searchEndDate) && (
                <Pressable
                  onPress={() => {
                    setSearchStartDate(null);
                    setSearchEndDate(null);
                  }}
                  className="mt-2"
                >
                  <Text className="text-xs text-primary-500">日付をクリア</Text>
                </Pressable>
              )}
            </View>

            {/* カテゴリフィルター */}
            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-3">カテゴリ</Text>
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => setSearchCategoryId(null)}
                  className={`rounded-full px-3 py-1.5 border ${
                    searchCategoryId === null
                      ? "bg-primary-500 border-primary-500"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      searchCategoryId === null ? "text-white" : "text-gray-700"
                    }`}
                  >
                    すべて
                  </Text>
                </Pressable>
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSearchCategoryId(cat.id)}
                    className={`rounded-full px-3 py-1.5 border ${
                      searchCategoryId === cat.id
                        ? "border-transparent"
                        : "bg-white border-gray-300"
                    }`}
                    style={searchCategoryId === cat.id ? { backgroundColor: cat.color || "#3b82f6" } : undefined}
                  >
                    <Text
                      className={`text-sm ${
                        searchCategoryId === cat.id ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* 検索ボタン */}
            <View className="flex-row gap-3 mb-4">
              <Pressable
                onPress={handleClearSearch}
                className="flex-1 rounded-xl py-3 bg-gray-200 active:bg-gray-300"
              >
                <Text className="text-center text-gray-700 font-medium">クリア</Text>
              </Pressable>
              <Pressable
                onPress={handleSearch}
                disabled={isSearching}
                className="flex-1 rounded-xl py-3 bg-primary-500 active:bg-primary-600"
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-center text-white font-medium">検索</Text>
                )}
              </Pressable>
            </View>

            {/* 検索結果 */}
            {searchResults.length > 0 && (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-3">
                  検索結果 ({searchResults.length}件)
                </Text>
                <View className="bg-white rounded-xl overflow-hidden">
                  {searchResults.map((schedule, index) => {
                    const category = categories.find((c) => c.id === schedule.categoryId);
                    return (
                      <Pressable
                        key={schedule.id}
                        onPress={() => {
                          setSelectedSchedule(schedule);
                          setIsSearchModalOpen(false);
                          setIsPopupOpen(true);
                        }}
                        className={`p-4 active:bg-gray-50 ${
                          index < searchResults.length - 1 ? "border-b border-gray-100" : ""
                        }`}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1">
                            <View className="flex-row items-center mb-1">
                              {category && (
                                <View
                                  className="w-2 h-2 rounded-full mr-2"
                                  style={{ backgroundColor: category.color || "#3b82f6" }}
                                />
                              )}
                              <Text className="text-gray-900 font-medium flex-1" numberOfLines={1}>
                                {schedule.title}
                              </Text>
                            </View>
                            <Text className="text-xs text-gray-500">
                              {format(new Date(schedule.startAt), "yyyy/MM/dd HH:mm")}
                              {schedule.isAllDay && " (終日)"}
                            </Text>
                          </View>
                          <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 検索結果なし */}
            {searchResults.length === 0 && (searchKeyword || searchStartDate || searchEndDate || searchCategoryId) && !isSearching && (
              <View className="items-center py-8">
                <MaterialIcons name="search-off" size={48} color="#d1d5db" />
                <Text className="text-gray-500 mt-2">条件に一致する予定が見つかりません</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* カテゴリ管理モーダル */}
      <Modal
        visible={isCategoryModalOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setIsCategoryModalOpen(false);
          setShowCategoryForm(false);
        }}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <Pressable onPress={() => { setIsCategoryModalOpen(false); setShowCategoryForm(false); }} className="p-2">
              <MaterialIcons name="close" size={24} color="#374151" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-900">カテゴリ管理</Text>
            <View className="w-10" />
          </View>

          <ScrollView className="flex-1 p-4">
            {/* 既存カテゴリ一覧 */}
            {categories.length === 0 ? (
              <Text className="text-gray-500 text-center py-4">カテゴリがありません</Text>
            ) : (
              <View className="bg-white rounded-xl mb-4">
                {categories.map((cat, index) => (
                  <View
                    key={cat.id}
                    className={`flex-row items-center justify-between py-3 px-4 ${
                      index < categories.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <View className="flex-row items-center flex-1">
                      <View
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: cat.color || "#3b82f6" }}
                      />
                      <Text className="text-gray-900">{cat.name}</Text>
                    </View>
                    <Pressable
                      onPress={() => handleDeleteCategory(cat.id, cat.name)}
                      className="p-2"
                    >
                      <MaterialIcons name="close" size={20} color="#9ca3af" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* カテゴリ作成フォーム */}
            {showCategoryForm ? (
              <View className="bg-white rounded-xl p-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">カテゴリ名</Text>
                <TextInput
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="例: 仕事"
                  placeholderTextColor="#9ca3af"
                  className="text-base text-gray-900 bg-gray-50 rounded-lg p-3 mb-4"
                />

                <Text className="text-sm font-medium text-gray-700 mb-2">カラー</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {categoryColors.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => setNewCategoryColor(color)}
                      className={`w-10 h-10 rounded-full items-center justify-center ${
                        newCategoryColor === color ? "border-2 border-gray-400" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {newCategoryColor === color && (
                        <MaterialIcons name="check" size={20} color="#ffffff" />
                      )}
                    </Pressable>
                  ))}
                </View>

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => {
                      setShowCategoryForm(false);
                      setNewCategoryName("");
                      setNewCategoryColor("#3B82F6");
                    }}
                    className="flex-1 rounded-xl py-3 bg-gray-200 active:bg-gray-300"
                  >
                    <Text className="text-center text-gray-700 font-medium">キャンセル</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCreateCategory}
                    disabled={!newCategoryName.trim() || isSavingCategory}
                    className={`flex-1 rounded-xl py-3 ${
                      newCategoryName.trim() ? "bg-primary-500 active:bg-primary-600" : "bg-gray-300"
                    }`}
                  >
                    {isSavingCategory ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text className="text-center text-white font-medium">作成</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => setShowCategoryForm(true)}
                className="flex-row items-center justify-center py-3 bg-primary-500 rounded-xl active:bg-primary-600"
              >
                <MaterialIcons name="add" size={20} color="#ffffff" />
                <Text className="ml-2 text-white font-medium">新規作成</Text>
              </Pressable>
            )}
          </ScrollView>

          <View className="border-t border-gray-200 bg-white p-4">
            <Pressable
              onPress={() => { setIsCategoryModalOpen(false); setShowCategoryForm(false); }}
              className="rounded-xl py-3 bg-gray-200 active:bg-gray-300"
            >
              <Text className="text-center text-gray-700 font-medium">閉じる</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* カレンダー管理モーダル */}
      <Modal
        visible={isCalendarManagementOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setIsCalendarManagementOpen(false);
          setShowCalendarForm(false);
          setShowDefaultPicker(false);
        }}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <Pressable onPress={() => {
              setIsCalendarManagementOpen(false);
              setShowCalendarForm(false);
              setShowDefaultPicker(false);
            }} className="p-2">
              <MaterialIcons name="close" size={24} color="#374151" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-900">カレンダー管理</Text>
            <View className="w-10" />
          </View>

          <ScrollView className="flex-1 p-4">
            {/* カレンダー一覧（表示/非表示切り替え） */}
            <View className="bg-white rounded-xl mb-4">
              {calendars.map((cal, index) => (
                <Pressable
                  key={cal.id}
                  onPress={() => toggleCalendar(cal.id)}
                  className={`flex-row items-center justify-between py-3 px-4 ${
                    index < calendars.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <View className="flex-row items-center flex-1">
                    <View
                      className={`w-5 h-5 rounded mr-3 items-center justify-center ${
                        selectedCalendarIds.includes(cal.id)
                          ? "bg-primary-500"
                          : "bg-gray-200"
                      }`}
                    >
                      {selectedCalendarIds.includes(cal.id) && (
                        <MaterialIcons name="check" size={16} color="#ffffff" />
                      )}
                    </View>
                    <View
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: cal.color || "#3b82f6" }}
                    />
                    <Text className="text-gray-900 flex-1">{cal.name}</Text>
                    {defaultCalendarId === cal.id && (
                      <View className="bg-primary-100 px-2 py-0.5 rounded mr-2">
                        <Text className="text-xs text-primary-700">デフォルト</Text>
                      </View>
                    )}
                    <Text className="text-xs text-gray-500">{cal.role}</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            {/* すべて表示ボタン */}
            <Pressable
              onPress={selectAllCalendars}
              className="flex-row items-center justify-center py-3 bg-white rounded-xl mb-4 active:bg-gray-50"
            >
              <MaterialIcons name="visibility" size={20} color="#6b7280" />
              <Text className="ml-2 text-gray-700 font-medium">すべて表示</Text>
            </Pressable>

            {/* デフォルトカレンダー変更 */}
            {showDefaultPicker ? (
              <View className="bg-white rounded-xl p-4 mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-3">デフォルトカレンダーを選択</Text>
                {calendars
                  .filter((c) => c.role === "owner" || c.role === "editor")
                  .map((cal) => (
                    <Pressable
                      key={cal.id}
                      onPress={() => {
                        setDefaultCalendar(cal.id);
                        setShowDefaultPicker(false);
                      }}
                      className="flex-row items-center py-2 active:opacity-70"
                    >
                      <View
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: cal.color || "#3b82f6" }}
                      />
                      <Text className="flex-1 text-gray-900">{cal.name}</Text>
                      {defaultCalendarId === cal.id && (
                        <MaterialIcons name="check" size={20} color="#3b82f6" />
                      )}
                    </Pressable>
                  ))}
                <Pressable
                  onPress={() => setShowDefaultPicker(false)}
                  className="mt-3 py-2"
                >
                  <Text className="text-center text-gray-500">キャンセル</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setShowDefaultPicker(true)}
                className="flex-row items-center justify-center py-3 bg-white rounded-xl mb-4 active:bg-gray-50"
              >
                <MaterialIcons name="star" size={20} color="#6b7280" />
                <Text className="ml-2 text-gray-700 font-medium">デフォルトカレンダーを変更</Text>
              </Pressable>
            )}

            {/* カレンダー作成フォーム */}
            {showCalendarForm ? (
              <View className="bg-white rounded-xl p-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">カレンダー名</Text>
                <TextInput
                  value={newCalendarName}
                  onChangeText={setNewCalendarName}
                  placeholder="新しいカレンダー"
                  placeholderTextColor="#9ca3af"
                  className="text-base text-gray-900 bg-gray-50 rounded-lg p-3 mb-4"
                />
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => {
                      setShowCalendarForm(false);
                      setNewCalendarName("");
                    }}
                    className="flex-1 rounded-xl py-3 bg-gray-200 active:bg-gray-300"
                  >
                    <Text className="text-center text-gray-700 font-medium">キャンセル</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCreateCalendar}
                    disabled={!newCalendarName.trim() || isCreatingCalendar}
                    className={`flex-1 rounded-xl py-3 ${
                      newCalendarName.trim() ? "bg-primary-500 active:bg-primary-600" : "bg-gray-300"
                    }`}
                  >
                    {isCreatingCalendar ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text className="text-center text-white font-medium">作成</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => setShowCalendarForm(true)}
                className="flex-row items-center justify-center py-3 bg-primary-500 rounded-xl active:bg-primary-600"
              >
                <MaterialIcons name="add" size={20} color="#ffffff" />
                <Text className="ml-2 text-white font-medium">新しいカレンダーを作成</Text>
              </Pressable>
            )}
          </ScrollView>

          <View className="border-t border-gray-200 bg-white p-4">
            <Pressable
              onPress={() => {
                setIsCalendarManagementOpen(false);
                setShowCalendarForm(false);
                setShowDefaultPicker(false);
              }}
              className="rounded-xl py-3 bg-gray-200 active:bg-gray-300"
            >
              <Text className="text-center text-gray-700 font-medium">閉じる</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* こだわり条件モーダル */}
      <Modal
        visible={isConditionsModalOpen}
        animationType="slide"
        presentationStyle="fullScreen"
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
          <ScrollView className="flex-1 p-4">
            <Text className="text-sm text-gray-600 mb-4">
              ここで設定した条件は、AI検索時に自動的に考慮されます。
            </Text>

            {/* 必須条件 */}
            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">必須条件</Text>
              <Text className="text-xs text-gray-500 mb-2">
                口コミで違反が見つかれば絶対に除外します
              </Text>
              <TextInput
                value={conditionsRequired}
                onChangeText={setConditionsRequired}
                placeholder="例: 禁煙"
                placeholderTextColor="#9ca3af"
                className="text-base text-gray-900 bg-gray-50 rounded-lg p-3"
              />
            </View>

            {/* 優先条件 */}
            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">優先条件</Text>
              <Text className="text-xs text-gray-500 mb-2">
                該当する候補を優先して表示します
              </Text>
              <TextInput
                value={conditionsPreferred}
                onChangeText={setConditionsPreferred}
                placeholder="例: 駅近、個室あり"
                placeholderTextColor="#9ca3af"
                className="text-base text-gray-900 bg-gray-50 rounded-lg p-3"
              />
            </View>

            {/* 重視するポイント */}
            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">重視するポイント</Text>
              <Text className="text-xs text-gray-500 mb-2">
                口コミを確認して評価します
              </Text>
              <TextInput
                value={conditionsImportant}
                onChangeText={setConditionsImportant}
                placeholder="例: 口コミ評価4.0以上"
                placeholderTextColor="#9ca3af"
                className="text-base text-gray-900 bg-gray-50 rounded-lg p-3"
              />
            </View>
          </ScrollView>

          <View className="border-t border-gray-200 bg-white p-4 flex-row gap-3">
            <Pressable
              onPress={() => setIsConditionsModalOpen(false)}
              className="flex-1 rounded-xl py-3 bg-gray-200 active:bg-gray-300"
            >
              <Text className="text-center text-gray-700 font-medium">キャンセル</Text>
            </Pressable>
            <Pressable
              onPress={handleSaveConditions}
              disabled={isSavingConditions}
              className="flex-1 rounded-xl py-3 bg-primary-500 active:bg-primary-600"
            >
              {isSavingConditions ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-center text-white font-medium">保存</Text>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* キーワード選択モーダル */}
      <Modal
        visible={isKeywordModalOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsKeywordModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <Pressable onPress={() => setIsKeywordModalOpen(false)} className="p-2">
              <MaterialIcons name="close" size={24} color="#374151" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-900">キーワード選択</Text>
            <View className="w-10" />
          </View>

          <ScrollView className="flex-1 p-4">
            <Text className="text-sm text-gray-600 mb-4">
              AIが予定に関連するキーワードを提案しました。気になる項目を選択してください。
            </Text>

            {isLoadingKeywords ? (
              <View className="items-center justify-center py-8">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="text-gray-500 mt-2">キーワードを生成中...</Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {keywords.map((keyword) => (
                  <Pressable
                    key={keyword}
                    onPress={() => toggleKeyword(keyword)}
                    className={`rounded-full px-4 py-2 border ${
                      selectedKeywords.includes(keyword)
                        ? "bg-primary-500 border-primary-500"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        selectedKeywords.includes(keyword) ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {keyword}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {profile?.requiredConditions && (
              <Text className="text-xs text-gray-500 mt-4">
                こだわり条件が設定されているため、キーワード未選択でも検索できます
              </Text>
            )}
          </ScrollView>

          <View className="border-t border-gray-200 bg-white p-4">
            <Pressable
              onPress={handleRegenerateKeywords}
              disabled={isLoadingKeywords}
              className="flex-row items-center justify-center py-2 mb-3"
            >
              <MaterialIcons name="refresh" size={20} color="#6b7280" />
              <Text className="ml-2 text-gray-600">別のキーワードを提案してもらう</Text>
            </Pressable>

            <View className="flex-row gap-3">
              <Pressable
                onPress={handleSkipSearch}
                className="flex-1 rounded-xl py-3 bg-gray-200 active:bg-gray-300"
              >
                <Text className="text-center text-gray-700 font-medium">スキップ</Text>
              </Pressable>
              <Pressable
                onPress={handleExecuteSearch}
                disabled={selectedKeywords.length === 0 && !profile?.requiredConditions}
                className={`flex-1 rounded-xl py-3 ${
                  selectedKeywords.length > 0 || profile?.requiredConditions
                    ? "bg-primary-500 active:bg-primary-600"
                    : "bg-gray-300"
                }`}
              >
                <Text className="text-center text-white font-medium">
                  検索する {selectedKeywords.length > 0 && `(${selectedKeywords.length}件選択中)`}
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* AI検索結果モーダル */}
      <Modal
        visible={isSearchResultModalOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseSearchResult}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <View className="w-10" />
            <View className="flex-row items-center">
              <Text className="text-lg font-semibold text-gray-900">検索結果</Text>
              {isStreaming && (
                <Text className="ml-2 text-sm text-gray-500">取得中...</Text>
              )}
            </View>
            <Pressable onPress={handleCloseSearchResult} className="p-2">
              <MaterialIcons name="close" size={24} color="#374151" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 p-4">
            {statusMessage && (
              <View className="flex-row items-center mb-4 bg-blue-50 rounded-lg p-3">
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text className="ml-2 text-blue-700 text-sm">{statusMessage}</Text>
              </View>
            )}

            {searchResult ? (
              <View className="bg-white rounded-xl p-4">
                <Text className="text-gray-700 leading-6">{searchResult}</Text>
              </View>
            ) : isStreaming ? (
              <View className="items-center justify-center py-8">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="text-gray-500 mt-2">検索中...</Text>
              </View>
            ) : null}
          </ScrollView>

          <View className="border-t border-gray-200 bg-white p-4">
            {isStreaming ? (
              <Pressable
                onPress={handleCloseSearchResult}
                className="rounded-xl py-3 bg-red-500 active:bg-red-600"
              >
                <Text className="text-center text-white font-medium">中断して閉じる</Text>
              </Pressable>
            ) : (
              <View>
                <Text className="text-xs text-gray-500 text-center mb-3">
                  完了後に自動保存されます
                </Text>
                <Pressable
                  onPress={handleCloseSearchResult}
                  className="rounded-xl py-3 bg-primary-500 active:bg-primary-600"
                >
                  <Text className="text-center text-white font-medium">閉じる</Text>
                </Pressable>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* その他メニュー（ボトムシート風） */}
      <Modal
        visible={isMoreMenuOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsMoreMenuOpen(false)}
      >
        <Pressable
          onPress={() => setIsMoreMenuOpen(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <Pressable onPress={() => {}} className="bg-white rounded-t-3xl">
            <View className="w-10 h-1 bg-gray-300 rounded-full self-center mt-3 mb-2" />
            <View className="px-4 pb-8">
              <Text className="text-lg font-bold text-gray-900 mb-4">メニュー</Text>

              <Pressable
                onPress={() => {
                  setIsMoreMenuOpen(false);
                  setIsCategoryModalOpen(true);
                }}
                className="flex-row items-center py-4 border-b border-gray-100 active:bg-gray-50"
              >
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-4">
                  <MaterialIcons name="label" size={22} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">カテゴリ管理</Text>
                  <Text className="text-sm text-gray-500">カテゴリの作成・編集</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
              </Pressable>

              <Pressable
                onPress={() => {
                  setIsMoreMenuOpen(false);
                  setIsCalendarManagementOpen(true);
                }}
                className="flex-row items-center py-4 border-b border-gray-100 active:bg-gray-50"
              >
                <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-4">
                  <MaterialIcons name="calendar-today" size={22} color="#22c55e" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">カレンダー管理</Text>
                  <Text className="text-sm text-gray-500">表示・デフォルト設定</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
              </Pressable>

              <Pressable
                onPress={() => setIsMoreMenuOpen(false)}
                className="mt-4 py-3 bg-gray-100 rounded-xl active:bg-gray-200"
              >
                <Text className="text-center text-gray-700 font-medium">閉じる</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
