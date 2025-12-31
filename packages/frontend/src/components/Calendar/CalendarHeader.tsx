import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/common/Button";
import { getMonthLabel } from "@/lib/date";

type CalendarHeaderProps = {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
};

export const CalendarHeader = ({
  currentMonth,
  onPreviousMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onPreviousMonth} aria-label="前の月">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-semibold text-gray-900 min-w-[140px] text-center">
          {getMonthLabel(currentMonth)}
        </h2>
        <Button variant="ghost" size="sm" onClick={onNextMonth} aria-label="次の月">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
      <Button variant="secondary" size="sm" onClick={onToday}>
        今日
      </Button>
    </div>
  );
};
