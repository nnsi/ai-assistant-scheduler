import { useState } from "react";
import { createScheduleInputSchema } from "@ai-scheduler/shared";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/cn";
import { formatDate, getTimezoneOffset } from "@/lib/date";

type ScheduleFormProps = {
  defaultDate?: Date;
  onSubmit: (data: { title: string; startAt: string; endAt?: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export const ScheduleForm = ({
  defaultDate,
  onSubmit,
  onCancel,
  isLoading = false,
}: ScheduleFormProps) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(
    formatDate(defaultDate || new Date(), "yyyy-MM-dd")
  );
  const [time, setTime] = useState("12:00");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startAt = `${date}T${time}:00${getTimezoneOffset()}`;
    const data = { title, startAt };

    const result = createScheduleInputSchema.safeParse(data);
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
    onSubmit(result.data);
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
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit" isLoading={isLoading}>
          次へ
        </Button>
      </div>
    </form>
  );
};
