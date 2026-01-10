import { useState, useCallback } from "react";
import { createScheduleInputSchema, updateScheduleInputSchema, type Category, type CreateRecurrenceRuleInput, type CalendarResponse } from "@ai-scheduler/shared";
import { Button } from "@/components/common/Button";
import { RecurrenceSettings } from "@/components/Recurrence";
import { CalendarColorDot } from "@/components/CalendarManagement/CalendarColorDot";
import { cn } from "@/lib/cn";
import { formatDate, formatDateString, getTimezoneOffset } from "@/lib/date";

type ScheduleFormData = {
  title: string;
  startAt: string;
  endAt?: string;
  isAllDay?: boolean;
  categoryId?: string;
  calendarId?: string;
  recurrence?: CreateRecurrenceRuleInput | null;
};

type ScheduleFormProps = {
  defaultDate?: Date;
  defaultTime?: string;
  initialValues?: {
    title: string;
    startAt: string;
    endAt?: string | null;
    isAllDay?: boolean;
    categoryId?: string | null;
    calendarId?: string | null;
    recurrence?: CreateRecurrenceRuleInput | null;
  };
  categories?: Category[];
  calendars?: CalendarResponse[];
  defaultCalendarId?: string | null;
  onSubmit: (data: ScheduleFormData) => void;
  onSimpleSave?: (data: ScheduleFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isSimpleSaving?: boolean;
  submitLabel?: string;
  mode?: "create" | "edit";
  showRecurrence?: boolean;
};

export const ScheduleForm = ({
  defaultDate,
  defaultTime,
  initialValues,
  categories = [],
  calendars = [],
  defaultCalendarId,
  onSubmit,
  onSimpleSave,
  onCancel,
  isLoading = false,
  isSimpleSaving = false,
  submitLabel = "AIで補完",
  mode = "create",
  showRecurrence = true,
}: ScheduleFormProps) => {
  const [title, setTitle] = useState(initialValues?.title || "");
  const [date, setDate] = useState(
    initialValues?.startAt
      ? formatDateString(initialValues.startAt, "yyyy-MM-dd")
      : formatDate(defaultDate || new Date(), "yyyy-MM-dd")
  );
  const [time, setTime] = useState(
    initialValues?.startAt
      ? formatDateString(initialValues.startAt, "HH:mm")
      : defaultTime ?? "12:00"
  );
  const [showEndTime, setShowEndTime] = useState(!!initialValues?.endAt);
  const [endDate, setEndDate] = useState(
    initialValues?.endAt
      ? formatDateString(initialValues.endAt, "yyyy-MM-dd")
      : formatDate(defaultDate || new Date(), "yyyy-MM-dd")
  );
  const [endTime, setEndTime] = useState(
    initialValues?.endAt
      ? formatDateString(initialValues.endAt, "HH:mm")
      : "13:00"
  );
  const [isAllDay, setIsAllDay] = useState(initialValues?.isAllDay ?? false);
  const [categoryId, setCategoryId] = useState<string | undefined>(initialValues?.categoryId ?? undefined);
  const [calendarId, setCalendarId] = useState<string | undefined>(
    initialValues?.calendarId ?? defaultCalendarId ?? undefined
  );
  const [recurrence, setRecurrence] = useState<CreateRecurrenceRuleInput | null>(
    initialValues?.recurrence ?? null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRecurrenceChange = useCallback((value: CreateRecurrenceRuleInput | null) => {
    setRecurrence(value);
  }, []);

  const validateAndGetData = (): ScheduleFormData | null => {
    // 終日の場合は00:00を使用
    const timeValue = isAllDay ? "00:00" : time;
    const startAt = `${date}T${timeValue}:00${getTimezoneOffset()}`;

    // 終了時間の構築
    let endAt: string | undefined;
    if (showEndTime) {
      const endTimeValue = isAllDay ? "23:59" : endTime;
      endAt = `${endDate}T${endTimeValue}:00${getTimezoneOffset()}`;
    }

    const data: ScheduleFormData = { title, startAt, endAt, isAllDay, categoryId, calendarId, recurrence };

    const schema = mode === "edit" ? updateScheduleInputSchema : createScheduleInputSchema;
    const result = schema.safeParse({ title, startAt, endAt, isAllDay, categoryId, calendarId });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const fieldName = err.path[0];
        if (typeof fieldName === "string") {
          fieldErrors[fieldName] = err.message;
        }
      });
      setErrors(fieldErrors);
      return null;
    }

    setErrors({});
    return data;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = validateAndGetData();
    if (data) {
      onSubmit(data);
    }
  };

  const handleSimpleSave = () => {
    const data = validateAndGetData();
    if (data && onSimpleSave) {
      onSimpleSave(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="schedule-title" className="block text-sm font-medium text-stone-700 mb-2">
          タイトル
        </label>
        <input
          id="schedule-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 都内 レストラン 新宿"
          className={cn(
            "w-full px-4 py-3 rounded-xl border bg-white",
            "text-stone-800 placeholder:text-stone-400",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
            errors.title ? "border-red-300" : "border-stone-200"
          )}
        />
        {errors.title && (
          <p className="mt-2 text-sm text-red-500">{errors.title}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          id="schedule-all-day"
          type="checkbox"
          checked={isAllDay}
          onChange={(e) => setIsAllDay(e.target.checked)}
          className="h-5 w-5 rounded-md border-stone-300 text-accent focus:ring-accent/30"
        />
        <label htmlFor="schedule-all-day" className="text-sm font-medium text-stone-700">
          終日
        </label>
      </div>

      {calendars.length > 1 && (
        <div>
          <label htmlFor="schedule-calendar" className="block text-sm font-medium text-stone-700 mb-2">
            カレンダー
          </label>
          <div className="flex flex-wrap gap-2">
            {calendars
              .filter((cal) => cal.role !== "viewer")
              .map((cal) => (
                <button
                  key={cal.id}
                  type="button"
                  onClick={() => setCalendarId(cal.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1.5",
                    calendarId === cal.id
                      ? "ring-2 ring-offset-1 ring-stone-400 bg-stone-100"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  )}
                >
                  <CalendarColorDot color={cal.color} />
                  {cal.name}
                </button>
              ))}
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div>
          <label htmlFor="schedule-category" className="block text-sm font-medium text-stone-700 mb-2">
            カテゴリ
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryId(undefined)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-all",
                categoryId === undefined
                  ? "bg-stone-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              )}
            >
              なし
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1.5",
                  categoryId === cat.id
                    ? "text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                )}
                style={categoryId === cat.id ? { backgroundColor: cat.color } : undefined}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* 開始日時 */}
        <div className={cn("grid gap-4", isAllDay ? "grid-cols-1" : "grid-cols-2")}>
          <div>
            <label htmlFor="schedule-date" className="block text-sm font-medium text-stone-700 mb-2">
              {showEndTime ? "開始日" : "日付"}
            </label>
            <input
              id="schedule-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                // 終了日が開始日より前の場合は同じ日に設定
                if (showEndTime && e.target.value > endDate) {
                  setEndDate(e.target.value);
                }
              }}
              className={cn(
                "w-full px-4 py-3 rounded-xl border bg-white",
                "text-stone-800",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
                "border-stone-200"
              )}
            />
          </div>
          {!isAllDay && (
            <div>
              <label htmlFor="schedule-time" className="block text-sm font-medium text-stone-700 mb-2">
                {showEndTime ? "開始時間" : "時間"}
              </label>
              <input
                id="schedule-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={cn(
                  "w-full px-4 py-3 rounded-xl border bg-white",
                  "text-stone-800",
                  "transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
                  "border-stone-200"
                )}
              />
            </div>
          )}
        </div>

        {/* 終了時間の切り替え */}
        {!showEndTime ? (
          <button
            type="button"
            onClick={() => setShowEndTime(true)}
            className="text-sm text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
          >
            <span>+</span>
            <span>終了時間を追加</span>
          </button>
        ) : (
          <>
            {/* 終了日時 */}
            <div className={cn("grid gap-4", isAllDay ? "grid-cols-1" : "grid-cols-2")}>
              <div>
                <label htmlFor="schedule-end-date" className="block text-sm font-medium text-stone-700 mb-2">
                  終了日
                </label>
                <input
                  id="schedule-end-date"
                  type="date"
                  value={endDate}
                  min={date}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white",
                    "text-stone-800",
                    "transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
                    errors.endAt ? "border-red-300" : "border-stone-200"
                  )}
                />
              </div>
              {!isAllDay && (
                <div>
                  <label htmlFor="schedule-end-time" className="block text-sm font-medium text-stone-700 mb-2">
                    終了時間
                  </label>
                  <input
                    id="schedule-end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border bg-white",
                      "text-stone-800",
                      "transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
                      errors.endAt ? "border-red-300" : "border-stone-200"
                    )}
                  />
                </div>
              )}
            </div>
            {errors.endAt && (
              <p className="text-sm text-red-500">{errors.endAt}</p>
            )}
            <button
              type="button"
              onClick={() => setShowEndTime(false)}
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              終了時間を削除
            </button>
          </>
        )}
      </div>

      {showRecurrence && (
        <RecurrenceSettings
          value={recurrence}
          onChange={handleRecurrenceChange}
          disabled={isLoading}
        />
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading || isSimpleSaving}>
          キャンセル
        </Button>
        {onSimpleSave && (
          <>
            <Button
              type="submit"
              variant="ai"
              isLoading={isLoading}
              disabled={isSimpleSaving}
            >
              {submitLabel}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSimpleSave}
              isLoading={isSimpleSaving}
              disabled={isLoading}
            >
              保存する
            </Button>
          </>
        )}
        {!onSimpleSave && (
          <Button
            type="submit"
            variant={mode === "create" ? "ai" : "primary"}
            isLoading={isLoading}
          >
            {submitLabel}
          </Button>
        )}
      </div>
    </form>
  );
};
