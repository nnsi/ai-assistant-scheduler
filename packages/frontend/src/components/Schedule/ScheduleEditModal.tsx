import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { ScheduleForm } from "./ScheduleForm";
import type { Schedule, UpdateScheduleInput } from "@ai-scheduler/shared";

type ScheduleEditModalProps = {
  schedule: Schedule | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, input: UpdateScheduleInput) => Promise<void>;
};

export const ScheduleEditModal = ({
  schedule,
  isOpen,
  onClose,
  onSave,
}: ScheduleEditModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: { title: string; startAt: string; endAt?: string; isAllDay?: boolean }) => {
    if (!schedule) return;

    setIsLoading(true);
    try {
      await onSave(schedule.id, {
        title: data.title,
        startAt: data.startAt,
        endAt: data.endAt,
        isAllDay: data.isAllDay,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!schedule) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="予定を編集">
      <ScheduleForm
        initialValues={{
          title: schedule.title,
          startAt: schedule.startAt,
          endAt: schedule.endAt,
          isAllDay: schedule.isAllDay,
        }}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isLoading={isLoading}
        submitLabel="保存"
        mode="edit"
      />
    </Modal>
  );
};
