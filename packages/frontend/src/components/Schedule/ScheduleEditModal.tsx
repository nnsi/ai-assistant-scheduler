import { Modal } from "@/components/common/Modal";
import { useCategories } from "@/hooks/useCategories";
import { useRecurrence } from "@/hooks/useRecurrence";
import { logger } from "@/lib/logger";
import type {
  CreateRecurrenceRuleInput,
  Schedule,
  UpdateScheduleInput,
} from "@ai-scheduler/shared";
import { useState } from "react";
import { ScheduleForm } from "./ScheduleForm";

type ScheduleEditModalProps = {
  schedule: Schedule | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, input: UpdateScheduleInput) => Promise<void>;
};

type FormData = {
  title: string;
  startAt: string;
  endAt?: string;
  isAllDay?: boolean;
  categoryId?: string;
  recurrence?: CreateRecurrenceRuleInput | null;
};

export const ScheduleEditModal = ({
  schedule,
  isOpen,
  onClose,
  onSave,
}: ScheduleEditModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { categories } = useCategories();
  const {
    recurrence,
    create: createRecurrence,
    remove: removeRecurrence,
  } = useRecurrence(schedule?.id ?? null);

  const handleSubmit = async (data: FormData) => {
    if (!schedule) return;

    setIsLoading(true);
    setError(null);
    try {
      // スケジュールを更新
      await onSave(schedule.id, {
        title: data.title,
        startAt: data.startAt,
        endAt: data.endAt,
        isAllDay: data.isAllDay,
        categoryId: data.categoryId ?? null,
      });

      // 繰り返しルールの処理
      if (data.recurrence) {
        // 新しい繰り返しルールを作成（既存があれば置き換え）
        try {
          await createRecurrence(schedule.id, data.recurrence);
        } catch (recurrenceError) {
          logger.error(
            "Failed to create/update recurrence",
            { category: "api", scheduleId: schedule.id },
            recurrenceError
          );
          setError("繰り返しルールの設定に失敗しました");
          return;
        }
      } else if (recurrence) {
        // 繰り返しルールが無効化された場合は削除
        try {
          await removeRecurrence(schedule.id);
        } catch (recurrenceError) {
          logger.error(
            "Failed to delete recurrence",
            { category: "api", scheduleId: schedule.id },
            recurrenceError
          );
          setError("繰り返しルールの削除に失敗しました");
          return;
        }
      }

      onClose();
    } catch (saveError) {
      logger.error(
        "Failed to update schedule",
        { category: "api", scheduleId: schedule.id },
        saveError
      );
      setError("予定の更新に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!schedule) return null;

  // 既存の繰り返しルールをCreateRecurrenceRuleInput形式に変換
  const initialRecurrence: CreateRecurrenceRuleInput | null = recurrence
    ? {
        frequency: recurrence.frequency,
        interval: recurrence.interval,
        daysOfWeek: recurrence.daysOfWeek ?? undefined,
        dayOfMonth: recurrence.dayOfMonth ?? undefined,
        weekOfMonth: recurrence.weekOfMonth ?? undefined,
        endType: recurrence.endType,
        endDate: recurrence.endDate ?? undefined,
        endCount: recurrence.endCount ?? undefined,
      }
    : null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="予定を編集">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
            aria-label="エラーを閉じる"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <ScheduleForm
        key={schedule.id}
        initialValues={{
          title: schedule.title,
          startAt: schedule.startAt,
          endAt: schedule.endAt,
          isAllDay: schedule.isAllDay,
          categoryId: schedule.categoryId,
          recurrence: initialRecurrence,
        }}
        categories={categories}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isLoading={isLoading}
        submitLabel="保存"
        mode="edit"
      />
    </Modal>
  );
};
