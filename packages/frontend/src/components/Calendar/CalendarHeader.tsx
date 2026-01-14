import { Button } from "@/components/common/Button";
import { cn } from "@/lib/cn";
import { getDayFullLabel, getMonthLabel, getWeekLabel } from "@/lib/date";
import {
  CalendarDays,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  Settings2,
  Tag,
  Users,
} from "lucide-react";

export type CalendarViewMode = "month" | "week" | "day";

type CalendarHeaderProps = {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onConditionsClick?: () => void;
  onCategoryClick?: () => void;
  onSearchClick?: () => void;
  onCalendarManageClick?: () => void;
};

export const CalendarHeader = ({
  currentDate,
  viewMode,
  onPrevious,
  onNext,
  onToday,
  onViewModeChange,
  onConditionsClick,
  onCategoryClick,
  onSearchClick,
  onCalendarManageClick,
}: CalendarHeaderProps) => {
  const getLabel = () => {
    switch (viewMode) {
      case "month":
        return getMonthLabel(currentDate);
      case "week":
        return getWeekLabel(currentDate);
      case "day":
        return getDayFullLabel(currentDate);
    }
  };

  const getMinWidth = () => {
    switch (viewMode) {
      case "month":
        return "min-w-[100px] sm:min-w-[140px]";
      case "week":
        return "min-w-[120px] sm:min-w-[160px]";
      case "day":
        return "min-w-[160px] sm:min-w-[220px]";
    }
  };

  const viewModes: { mode: CalendarViewMode; icon: typeof CalendarDays; label: string }[] = [
    { mode: "month", icon: CalendarDays, label: "月表示" },
    { mode: "week", icon: CalendarIcon, label: "週表示" },
    { mode: "day", icon: Clock, label: "日表示" },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevious}
          className={cn(
            "p-2 rounded-xl text-stone-500",
            "hover:bg-stone-100 hover:text-stone-700",
            "transition-all duration-200",
            "active:scale-95"
          )}
          aria-label="前へ"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2
          className={cn(
            "text-lg sm:text-2xl font-display text-stone-900",
            getMinWidth(),
            "text-center"
          )}
        >
          {getLabel()}
        </h2>
        <button
          onClick={onNext}
          className={cn(
            "p-2 rounded-xl text-stone-500",
            "hover:bg-stone-100 hover:text-stone-700",
            "transition-all duration-200",
            "active:scale-95"
          )}
          aria-label="次へ"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
          {viewModes.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                viewMode === mode
                  ? "bg-white shadow-sm text-accent"
                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
              )}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Search Button */}
        {onSearchClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSearchClick}
            aria-label="予定を検索"
            title="予定を検索"
            className="text-stone-600"
          >
            <Search className="w-5 h-5" />
            <span className="ml-1.5 hidden sm:inline">検索</span>
          </Button>
        )}

        {/* Category Button */}
        {onCategoryClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCategoryClick}
            aria-label="カテゴリ管理"
            title="カテゴリ管理"
            className="text-stone-600"
          >
            <Tag className="w-5 h-5" />
            <span className="ml-1.5 hidden sm:inline">カテゴリ</span>
          </Button>
        )}

        {/* Calendar Manage Button */}
        {onCalendarManageClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCalendarManageClick}
            aria-label="カレンダー管理"
            title="カレンダー管理"
            className="text-stone-600"
          >
            <Users className="w-5 h-5" />
            <span className="ml-1.5 hidden sm:inline">カレンダー</span>
          </Button>
        )}

        {/* Conditions Button */}
        {onConditionsClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onConditionsClick}
            aria-label="こだわり条件設定"
            title="こだわり条件設定"
            className="text-stone-600"
          >
            <Settings2 className="w-5 h-5" />
            <span className="ml-1.5 hidden sm:inline">こだわり条件</span>
          </Button>
        )}

        {/* Today Button */}
        <Button variant="secondary" size="sm" onClick={onToday}>
          今日
        </Button>
      </div>
    </div>
  );
};
