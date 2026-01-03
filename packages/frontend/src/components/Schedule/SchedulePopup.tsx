import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/common/Modal";
import { ScheduleDetail } from "./ScheduleDetail";
import { Loader2 } from "lucide-react";
import * as api from "@/lib/api";
import { logger } from "@/lib/logger";
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
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const scheduleId = schedule?.id;
  const queryKey = ["schedule", scheduleId];

  const { data: fullSchedule, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.fetchScheduleById(scheduleId!),
    enabled: !!scheduleId && isOpen,
  });

  const memoMutation = useMutation({
    mutationFn: (memo: string) => api.updateMemo(scheduleId!, memo),
    onSuccess: async () => {
      // 補足情報を再取得
      const updated = await api.fetchScheduleById(scheduleId!);
      queryClient.setQueryData<ScheduleWithSupplement>(queryKey, updated);
    },
    onError: (error) => {
      logger.error("Failed to save memo", { category: "api", scheduleId }, error);
    },
  });

  const handleDelete = async () => {
    if (!schedule) return;
    setIsDeleting(true);
    try {
      await api.deleteSchedule(schedule.id);
      onDelete(schedule.id);
      onClose();
    } catch (error) {
      logger.error("Failed to delete schedule", { category: "api", scheduleId: schedule.id }, error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMemoSave = async (memo: string) => {
    if (!schedule) return;
    await memoMutation.mutateAsync(memo);
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
          isSavingMemo={memoMutation.isPending}
        />
      ) : null}
    </Modal>
  );
};
