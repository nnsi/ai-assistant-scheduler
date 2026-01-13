/**
 * カレンダーヘッダー
 * Web版と同じ構成：日付ナビゲーション、表示モード切替、機能ボタン
 */
import { View, Text, Pressable, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export type CalendarViewMode = "month" | "week" | "day";

type CalendarHeaderProps = {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onSearchClick?: () => void;
  onCategoryClick?: () => void;
  onCalendarManageClick?: () => void;
  onConditionsClick?: () => void;
};

const getLabel = (date: Date, viewMode: CalendarViewMode): string => {
  switch (viewMode) {
    case "month":
      return format(date, "yyyy年M月", { locale: ja });
    case "week": {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return format(weekStart, "yyyy年M月d日", { locale: ja }) + "〜" + format(weekEnd, "d日", { locale: ja });
      }
      return format(weekStart, "M/d", { locale: ja }) + "〜" + format(weekEnd, "M/d", { locale: ja });
    }
    case "day":
      return format(date, "yyyy年M月d日(E)", { locale: ja });
  }
};

export const CalendarHeader = ({
  currentDate,
  viewMode,
  onPrevious,
  onNext,
  onToday,
  onViewModeChange,
  onSearchClick,
  onCategoryClick,
  onCalendarManageClick,
  onConditionsClick,
}: CalendarHeaderProps) => {
  const viewModes: { mode: CalendarViewMode; icon: keyof typeof MaterialIcons.glyphMap; label: string }[] = [
    { mode: "month", icon: "calendar-view-month", label: "月" },
    { mode: "week", icon: "view-week", label: "週" },
    { mode: "day", icon: "view-day", label: "日" },
  ];

  return (
    <View className="bg-white border-b border-gray-200">
      {/* 日付ナビゲーション */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center">
          <Pressable
            onPress={onPrevious}
            className="p-2 rounded-xl active:bg-gray-100"
          >
            <MaterialIcons name="chevron-left" size={24} color="#78716c" />
          </Pressable>
          <Text className="text-lg font-semibold text-gray-900 min-w-[140px] text-center">
            {getLabel(currentDate, viewMode)}
          </Text>
          <Pressable
            onPress={onNext}
            className="p-2 rounded-xl active:bg-gray-100"
          >
            <MaterialIcons name="chevron-right" size={24} color="#78716c" />
          </Pressable>
        </View>

        {/* 今日ボタン */}
        <Pressable
          onPress={onToday}
          className="px-3 py-1.5 rounded-lg bg-gray-100 active:bg-gray-200"
        >
          <Text className="text-sm font-medium text-gray-700">今日</Text>
        </Pressable>
      </View>

      {/* 表示モード切替と機能ボタン */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-t border-gray-100"
        contentContainerClassName="px-4 py-2 gap-2"
      >
        {/* 表示モード切替 */}
        <View className="flex-row bg-gray-100 rounded-xl p-1">
          {viewModes.map(({ mode, icon, label }) => (
            <Pressable
              key={mode}
              onPress={() => onViewModeChange(mode)}
              className={`px-3 py-1.5 rounded-lg ${
                viewMode === mode ? "bg-white shadow-sm" : ""
              }`}
            >
              <View className="flex-row items-center gap-1">
                <MaterialIcons
                  name={icon}
                  size={16}
                  color={viewMode === mode ? "#3b82f6" : "#78716c"}
                />
                <Text
                  className={`text-sm font-medium ${
                    viewMode === mode ? "text-primary-500" : "text-gray-600"
                  }`}
                >
                  {label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* 検索ボタン */}
        {onSearchClick && (
          <Pressable
            onPress={onSearchClick}
            className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg active:bg-gray-100"
          >
            <MaterialIcons name="search" size={20} color="#78716c" />
            <Text className="text-sm font-medium text-gray-600">検索</Text>
          </Pressable>
        )}

        {/* カテゴリボタン */}
        {onCategoryClick && (
          <Pressable
            onPress={onCategoryClick}
            className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg active:bg-gray-100"
          >
            <MaterialIcons name="label" size={20} color="#78716c" />
            <Text className="text-sm font-medium text-gray-600">カテゴリ</Text>
          </Pressable>
        )}

        {/* カレンダー管理ボタン */}
        {onCalendarManageClick && (
          <Pressable
            onPress={onCalendarManageClick}
            className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg active:bg-gray-100"
          >
            <MaterialIcons name="people" size={20} color="#78716c" />
            <Text className="text-sm font-medium text-gray-600">カレンダー</Text>
          </Pressable>
        )}

        {/* こだわり条件ボタン */}
        {onConditionsClick && (
          <Pressable
            onPress={onConditionsClick}
            className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg active:bg-gray-100"
          >
            <MaterialIcons name="tune" size={20} color="#78716c" />
            <Text className="text-sm font-medium text-gray-600">条件</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
};
