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
  const { categories } = useCategories();
  const {
    recurrence,
    create: createRecurrence,
    remove: removeRecurrence,
  } = useRecurrence(schedule?.id ?? null);

  const handleSubmit = async (data: FormData) => {
    if (!schedule) return;

    setIsLoading(true);
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
        } catch (error) {
          logger.error(
            "Failed to create/update recurrence",
            { category: "api", scheduleId: schedule.id },
            error
          );
        }
      } else if (recurrence) {
        // 繰り返しルールが無効化された場合は削除
        try {
          await removeRecurrence(schedule.id);
        } catch (error) {
          logger.error(
            "Failed to delete recurrence",
            { category: "api", scheduleId: schedule.id },
            error
          );
        }
      }

      onClose();
    } finally {
      setIsLoading(false);
    }
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
    <Modal isOpen={isOpen} onClose={onClose} title="予定を編集">
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
        onCancel={onClose}
        isLoading={isLoading}
        submitLabel="保存"
        mode="edit"
      />
    </Modal>
  );
};
