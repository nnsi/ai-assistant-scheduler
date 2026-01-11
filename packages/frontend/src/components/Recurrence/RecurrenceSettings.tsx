import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp, Repeat } from "lucide-react";
import {
  DAYS_OF_WEEK,
  FREQUENCIES,
  END_TYPES,
  DAY_OF_WEEK_LABELS,
  FREQUENCY_LABELS,
  type DayOfWeek,
  type Frequency,
  type EndType,
  type CreateRecurrenceRuleInput,
} from "@ai-scheduler/shared";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/date";

type RecurrenceSettingsProps = {
  value: CreateRecurrenceRuleInput | null;
  onChange: (value: CreateRecurrenceRuleInput | null) => void;
  disabled?: boolean;
};

const END_TYPE_LABELS: Record<EndType, string> = {
  never: "無期限",
  date: "終了日を指定",
  count: "回数を指定",
};

export const RecurrenceSettings = ({
  value,
  onChange,
  disabled = false,
}: RecurrenceSettingsProps) => {
  const [isEnabled, setIsEnabled] = useState(!!value);
  const [isExpanded, setIsExpanded] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>(value?.frequency ?? "weekly");
  const [interval, setInterval] = useState(value?.interval ?? 1);
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>(value?.daysOfWeek ?? ["MO"]);
  const [dayOfMonth, setDayOfMonth] = useState(value?.dayOfMonth ?? 1);
  const [endType, setEndType] = useState<EndType>(value?.endType ?? "never");
  const [endDate, setEndDate] = useState(value?.endDate ?? "");
  const [endCount, setEndCount] = useState(value?.endCount ?? 10);

  // 現在のstateとoverrideから新しいruleを構築
  const buildRule = useCallback((overrides: Partial<{
    isEnabled: boolean;
    frequency: Frequency;
    interval: number;
    daysOfWeek: DayOfWeek[];
    dayOfMonth: number;
    endType: EndType;
    endDate: string;
    endCount: number;
  }> = {}): CreateRecurrenceRuleInput | null => {
    const enabled = overrides.isEnabled ?? isEnabled;
    if (!enabled) return null;

    const freq = overrides.frequency ?? frequency;
    const intv = overrides.interval ?? interval;
    const endT = overrides.endType ?? endType;

    const rule: CreateRecurrenceRuleInput = {
      frequency: freq,
      interval: intv,
      endType: endT,
    };

    if (freq === "weekly") {
      rule.daysOfWeek = overrides.daysOfWeek ?? daysOfWeek;
    }

    if (freq === "monthly") {
      rule.dayOfMonth = overrides.dayOfMonth ?? dayOfMonth;
    }

    if (endT === "date") {
      const ed = overrides.endDate ?? endDate;
      if (ed) rule.endDate = ed;
    }

    if (endT === "count") {
      rule.endCount = overrides.endCount ?? endCount;
    }

    return rule;
  }, [isEnabled, frequency, interval, daysOfWeek, dayOfMonth, endType, endDate, endCount]);

  const handleEnabledChange = useCallback((checked: boolean) => {
    setIsEnabled(checked);
    onChange(buildRule({ isEnabled: checked }));
  }, [onChange, buildRule]);

  const handleFrequencyChange = useCallback((f: Frequency) => {
    setFrequency(f);
    onChange(buildRule({ frequency: f }));
  }, [onChange, buildRule]);

  const handleIntervalChange = useCallback((v: number) => {
    setInterval(v);
    onChange(buildRule({ interval: v }));
  }, [onChange, buildRule]);

  const handleDaysOfWeekChange = useCallback((days: DayOfWeek[]) => {
    setDaysOfWeek(days);
    onChange(buildRule({ daysOfWeek: days }));
  }, [onChange, buildRule]);

  const handleDayOfMonthChange = useCallback((day: number) => {
    setDayOfMonth(day);
    onChange(buildRule({ dayOfMonth: day }));
  }, [onChange, buildRule]);

  const handleEndTypeChange = useCallback((type: EndType) => {
    setEndType(type);
    onChange(buildRule({ endType: type }));
  }, [onChange, buildRule]);

  const handleEndDateChange = useCallback((date: string) => {
    setEndDate(date);
    onChange(buildRule({ endDate: date }));
  }, [onChange, buildRule]);

  const handleEndCountChange = useCallback((count: number) => {
    setEndCount(count);
    onChange(buildRule({ endCount: count }));
  }, [onChange, buildRule]);

  const toggleDay = (day: DayOfWeek) => {
    let newDays: DayOfWeek[];
    if (daysOfWeek.includes(day)) {
      if (daysOfWeek.length > 1) {
        newDays = daysOfWeek.filter((d) => d !== day);
      } else {
        return; // 最低1つは必要
      }
    } else {
      newDays = [...daysOfWeek, day];
    }
    handleDaysOfWeekChange(newDays);
  };

  const getIntervalLabel = () => {
    switch (frequency) {
      case "daily":
        return "日ごと";
      case "weekly":
        return "週ごと";
      case "monthly":
        return "ヶ月ごと";
      case "yearly":
        return "年ごと";
    }
  };

  const getSummary = () => {
    if (!isEnabled) return null;

    let text = "";
    if (interval === 1) {
      text = FREQUENCY_LABELS[frequency];
    } else {
      text = `${interval}${getIntervalLabel()}`;
    }

    if (frequency === "weekly" && daysOfWeek.length > 0) {
      const days = daysOfWeek
        .sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b))
        .map((d) => DAY_OF_WEEK_LABELS[d])
        .join("・");
      text += `（${days}）`;
    }

    if (frequency === "monthly") {
      text += `（${dayOfMonth}日）`;
    }

    return text;
  };

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      isEnabled ? "border-accent/30 bg-accent/5" : "border-stone-200 bg-white"
    )}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              isEnabled ? "bg-accent/20 text-accent" : "bg-stone-100 text-stone-500"
            )}>
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-stone-800">繰り返し</span>
                {isEnabled && getSummary() && (
                  <span className="text-sm text-accent">{getSummary()}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => {
                  handleEnabledChange(e.target.checked);
                  if (e.target.checked) {
                    setIsExpanded(true);
                  }
                }}
                disabled={disabled}
                className="sr-only peer"
              />
              <div className={cn(
                "w-11 h-6 rounded-full transition-colors",
                "bg-stone-200 peer-checked:bg-accent",
                "after:content-[''] after:absolute after:top-[2px] after:left-[2px]",
                "after:bg-white after:rounded-full after:h-5 after:w-5",
                "after:transition-transform after:shadow-sm",
                "peer-checked:after:translate-x-5"
              )} />
            </label>
            {isEnabled && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-stone-100 rounded-lg transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-stone-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-500" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Settings */}
      {isEnabled && isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-stone-200/50 pt-4">
          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">
              頻度
            </label>
            <div className="flex flex-wrap gap-2">
              {FREQUENCIES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleFrequencyChange(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm transition-all",
                    frequency === f
                      ? "bg-accent text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  )}
                >
                  {FREQUENCY_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          {/* Interval */}
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">
              間隔
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={99}
                value={interval}
                onChange={(e) => handleIntervalChange(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                className={cn(
                  "w-20 px-3 py-2 rounded-lg border border-stone-200 bg-white",
                  "text-stone-800 text-center",
                  "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                )}
              />
              <span className="text-stone-600">{getIntervalLabel()}</span>
            </div>
          </div>

          {/* Days of Week (for weekly) */}
          {frequency === "weekly" && (
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-2">
                曜日
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-sm font-medium transition-all",
                      daysOfWeek.includes(day)
                        ? "bg-accent text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    )}
                  >
                    {DAY_OF_WEEK_LABELS[day]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day of Month (for monthly) */}
          {frequency === "monthly" && (
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-2">
                日付
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={dayOfMonth}
                  onChange={(e) => handleDayOfMonthChange(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
                  className={cn(
                    "w-20 px-3 py-2 rounded-lg border border-stone-200 bg-white",
                    "text-stone-800 text-center",
                    "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  )}
                />
                <span className="text-stone-600">日</span>
              </div>
            </div>
          )}

          {/* End Type */}
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">
              終了条件
            </label>
            <div className="space-y-2">
              {END_TYPES.map((type) => (
                <label
                  key={type}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    endType === type
                      ? "border-accent bg-accent/5"
                      : "border-stone-200 hover:border-stone-300"
                  )}
                >
                  <input
                    type="radio"
                    name="endType"
                    value={type}
                    checked={endType === type}
                    onChange={() => handleEndTypeChange(type)}
                    className="text-accent focus:ring-accent/30"
                  />
                  <span className="text-stone-700">{END_TYPE_LABELS[type]}</span>

                  {type === "date" && endType === "date" && (
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      min={formatDate(new Date(), "yyyy-MM-dd")}
                      className={cn(
                        "ml-auto px-3 py-1.5 rounded-lg border border-stone-200 bg-white",
                        "text-stone-800 text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                      )}
                    />
                  )}

                  {type === "count" && endType === "count" && (
                    <div className="ml-auto flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={endCount}
                        onChange={(e) => handleEndCountChange(Math.max(1, Math.min(999, parseInt(e.target.value) || 1)))}
                        className={cn(
                          "w-16 px-2 py-1.5 rounded-lg border border-stone-200 bg-white",
                          "text-stone-800 text-sm text-center",
                          "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                        )}
                      />
                      <span className="text-sm text-stone-600">回</span>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
