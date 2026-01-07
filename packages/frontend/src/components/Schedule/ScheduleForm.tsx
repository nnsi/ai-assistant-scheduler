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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="schedule-title" className="block text-sm font-medium text-gray-700 mb-1">
          タイトル
        </label>
        <input
          id="schedule-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 都内 レストラン 新宿"
          className={cn(
            "w-full px-3 py-2 border rounded-md shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
            errors.title ? "border-red-500" : "border-gray-300"
          )}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="schedule-all-day"
          type="checkbox"
          checked={isAllDay}
          onChange={(e) => setIsAllDay(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="schedule-all-day" className="text-sm font-medium text-gray-700">
          終日
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-700 mb-1">
            日付
          </label>
          <input
            id="schedule-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={cn(
              "w-full px-3 py-2 border rounded-md shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
              "border-gray-300"
            )}
          />
        </div>
        {!isAllDay && (
          <div>
            <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-700 mb-1">
              時間
            </label>
            <input
              id="schedule-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={cn(
                "w-full px-3 py-2 border rounded-md shadow-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                "border-gray-300"
              )}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};
