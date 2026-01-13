/**
 * カレンダーヘッダー
 * モバイル最適化：コンパクトなナビゲーション、アイコンのみのツールバー
 */
import { View, Text, Pressable } from "react-native";
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
        return format(weekStart, "M/d", { locale: ja }) + "〜" + format(weekEnd, "d", { locale: ja });
      }
      return format(weekStart, "M/d", { locale: ja }) + "〜" + format(weekEnd, "M/d", { locale: ja });
    }
    case "day":
      return format(date, "M/d(E)", { locale: ja });
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
  const viewModes: { mode: CalendarViewMode; label: string }[] = [
    { mode: "month", label: "月" },
    { mode: "week", label: "週" },
    { mode: "day", label: "日" },
  ];

  return (
    <View className="bg-white">
      {/* メインナビゲーション行：日付 + 表示切替 + ツールボタン */}
      <View className="flex-row items-center justify-between px-3 py-2">
        {/* 日付ナビゲーション */}
        <View className="flex-row items-center">
          <Pressable
            onPress={onPrevious}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-gray-100"
          >
            <MaterialIcons name="chevron-left" size={28} color="#374151" />
          </Pressable>
          <Pressable
            onPress={onToday}
            className="px-2 py-1 active:bg-gray-100 rounded-lg"
          >
            <Text className="text-base font-bold text-gray-900">
              {getLabel(currentDate, viewMode)}
            </Text>
          </Pressable>
          <Pressable
            onPress={onNext}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-gray-100"
          >
            <MaterialIcons name="chevron-right" size={28} color="#374151" />
          </Pressable>
        </View>

        {/* 右側：表示モード切替 + ツールボタン */}
        <View className="flex-row items-center gap-1">
          {/* 表示モード切替（セグメント） */}
          <View className="flex-row bg-gray-100 rounded-lg p-0.5 mr-2">
            {viewModes.map(({ mode, label }) => (
              <Pressable
                key={mode}
                onPress={() => onViewModeChange(mode)}
                className={`px-3 py-1.5 rounded-md ${
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

          {/* ツールボタン（アイコンのみ） */}
          {onSearchClick && (
            <Pressable
              onPress={onSearchClick}
              className="w-10 h-10 items-center justify-center rounded-full active:bg-gray-100"
            >
              <MaterialIcons name="search" size={22} color="#6b7280" />
            </Pressable>
          )}

          {onConditionsClick && (
            <Pressable
              onPress={onConditionsClick}
              className="w-10 h-10 items-center justify-center rounded-full active:bg-gray-100"
            >
              <MaterialIcons name="tune" size={22} color="#6b7280" />
            </Pressable>
          )}

          {/* その他のボタンはメニューに統合（長押しでアクセス可能なことを示す点） */}
          <Pressable
            onPress={onCalendarManageClick}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-gray-100"
          >
            <MaterialIcons name="more-vert" size={22} color="#6b7280" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};
