import { useEffect, useState } from "react";
import { Modal } from "@/components/common/Modal";
import { ScheduleDetail } from "./ScheduleDetail";
import { Loader2 } from "lucide-react";
import * as api from "@/lib/api";
import type { Schedule, ScheduleWithSupplement } from "@ai-scheduler/shared";

type SchedulePopupProps = {
  schedule: Schedule | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
};

export const SchedulePopup = ({
  schedule,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: SchedulePopupProps) => {
  const [fullSchedule, setFullSchedule] = useState<ScheduleWithSupplement | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingMemo, setIsSavingMemo] = useState(false);

  useEffect(() => {
    if (schedule && isOpen) {
      setIsLoading(true);
      api
        .fetchScheduleById(schedule.id)
        .then(setFullSchedule)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setFullSchedule(null);
    }
  }, [schedule, isOpen]);

  const handleDelete = async () => {
    if (!schedule) return;
    setIsDeleting(true);
    try {
      await api.deleteSchedule(schedule.id);
      onDelete(schedule.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete schedule:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMemoSave = async (memo: string) => {
    if (!schedule) return;
    setIsSavingMemo(true);
    try {
      await api.updateMemo(schedule.id, memo);
      // 補足情報を再取得
      const updated = await api.fetchScheduleById(schedule.id);
      setFullSchedule(updated);
    } catch (error) {
      console.error("Failed to save memo:", error);
    } finally {
      setIsSavingMemo(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="予定詳細" size="lg">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : fullSchedule ? (
        <ScheduleDetail
          schedule={fullSchedule}
          onEdit={() => onEdit(fullSchedule)}
          onDelete={handleDelete}
          onMemoSave={handleMemoSave}
          isDeleting={isDeleting}
          isSavingMemo={isSavingMemo}
        />
      ) : null}
    </Modal>
  );
};
