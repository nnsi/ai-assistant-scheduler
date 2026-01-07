import { useState } from "react";
import { createScheduleInputSchema, updateScheduleInputSchema } from "@ai-scheduler/shared";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/cn";
import { formatDate, formatDateString, getTimezoneOffset } from "@/lib/date";

type ScheduleFormProps = {
  defaultDate?: Date;
  defaultTime?: string;
  initialValues?: {
    title: string;
    startAt: string;
    endAt?: string | null;
    isAllDay?: boolean;
  };
  onSubmit: (data: { title: string; startAt: string; endAt?: string; isAllDay?: boolean }) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  mode?: "create" | "edit";
};

export const ScheduleForm = ({
  defaultDate,
  defaultTime,
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "次へ",
  mode = "create",
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
  const [isAllDay, setIsAllDay] = useState(initialValues?.isAllDay ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 終日の場合は00:00を使用
    const timeValue = isAllDay ? "00:00" : time;
    const startAt = `${date}T${timeValue}:00${getTimezoneOffset()}`;
    const data = { title, startAt, isAllDay };

    const schema = mode === "edit" ? updateScheduleInputSchema : createScheduleInputSchema;
    const result = schema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const fieldName = err.path[0];
        if (typeof fieldName === "string") {
          fieldErrors[fieldName] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit(data);
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

      <div className={cn("grid gap-4", isAllDay ? "grid-cols-1" : "grid-cols-2")}>
        <div>
          <label htmlFor="schedule-date" className="block text-sm font-medium text-stone-700 mb-2">
            日付
          </label>
          <input
            id="schedule-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
              時間
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

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};
