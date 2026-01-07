import { ChevronLeft, ChevronRight, Settings2, CalendarDays, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/common/Button";
import { getMonthLabel, getWeekLabel, getDayFullLabel } from "@/lib/date";

export type CalendarViewMode = "month" | "week" | "day";

type CalendarHeaderProps = {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onConditionsClick?: () => void;
};

export const CalendarHeader = ({
  currentDate,
  viewMode,
  onPrevious,
  onNext,
  onToday,
  onViewModeChange,
  onConditionsClick,
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

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 sm:mb-4">
      <div className="flex items-center gap-1 sm:gap-2">
        <Button variant="ghost" size="sm" onClick={onPrevious} aria-label="前へ">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className={`text-sm sm:text-xl font-semibold text-gray-900 ${getMinWidth()} text-center`}>
          {getLabel()}
        </h2>
        <Button variant="ghost" size="sm" onClick={onNext} aria-label="次へ">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-2">
        {/* ビュー切り替えボタン */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => onViewModeChange("month")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "month"
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="月表示"
          >
            <CalendarDays className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange("week")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "week"
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="週表示"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange("day")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "day"
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="日表示"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>

        {onConditionsClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onConditionsClick}
            aria-label="こだわり条件設定"
            title="こだわり条件設定"
          >
            <Settings2 className="w-5 h-5" />
            <span className="ml-1 hidden sm:inline">こだわり条件</span>
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={onToday}>
          今日
        </Button>
      </div>
    </div>
  );
};
