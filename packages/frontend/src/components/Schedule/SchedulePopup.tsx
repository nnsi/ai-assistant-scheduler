import { KeywordSuggestions } from "@/components/AI/KeywordSuggestions";
import { SearchResults } from "@/components/AI/SearchResults";
import { Modal } from "@/components/common/Modal";
import { useAI } from "@/hooks/useAI";
import * as api from "@/lib/api";
import { logger } from "@/lib/logger";
import type { Schedule, ScheduleWithSupplement, ShopList } from "@ai-scheduler/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ScheduleDetail } from "./ScheduleDetail";

type Step = "detail" | "keywords" | "results";

type SchedulePopupProps = {
  schedule: Schedule | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => Promise<void>;
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
  const [step, setStep] = useState<Step>("detail");
  const [isSelectingShops, setIsSelectingShops] = useState(false);
  const ai = useAI();

  const scheduleId = schedule?.id;
  const queryKey = ["schedule", scheduleId];

  const { data: fullSchedule, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.fetchScheduleById(scheduleId!),
    enabled: !!scheduleId && isOpen,
  });

  // モーダルを閉じたらステップをリセット
  // biome-ignore lint/correctness/useExhaustiveDependencies: ai.reset is a stable reference
  useEffect(() => {
    if (!isOpen) {
      setStep("detail");
      ai.reset();
    }
  }, [isOpen]);

  const memoMutation = useMutation({
    mutationFn: (memo: string) => api.updateMemo(scheduleId!, memo),
    onSuccess: async () => {
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
      await onDelete(schedule.id);
      onClose();
    } catch (error) {
      logger.error(
        "Failed to delete schedule",
        { category: "api", scheduleId: schedule.id },
        error
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMemoSave = async (memo: string) => {
    if (!schedule) return;
    await memoMutation.mutateAsync(memo);
  };

  // AI再検索を開始
  const handleResearchStart = async () => {
    if (!fullSchedule) return;
    await ai.suggestKeywords(fullSchedule.title, fullSchedule.startAt);
    setStep("keywords");
  };

  // キーワード選択時に検索を実行
  const handleKeywordSelect = async (selectedKeywords: string[]) => {
    if (!fullSchedule || !scheduleId) return;
    setStep("results");
    await ai.searchAndSaveStream(
      scheduleId,
      fullSchedule.title,
      fullSchedule.startAt,
      selectedKeywords
    );
  };

  // キーワード再生成
  const handleRegenerateKeywords = async () => {
    if (!fullSchedule) return;
    await ai.regenerateKeywords(fullSchedule.title, fullSchedule.startAt);
  };

  // 店舗選択完了時（既存店舗に追加）
  const handleSelectShops = async (newShops: ShopList) => {
    if (!scheduleId || !fullSchedule) return;
    setIsSelectingShops(true);
    try {
      const existingShops = fullSchedule.supplement?.selectedShops ?? [];
      const mergedShops = [...existingShops, ...newShops];
      await api.selectShops(scheduleId, mergedShops);
      // キャッシュを更新
      await queryClient.invalidateQueries({ queryKey });
      setStep("detail");
    } catch (error) {
      logger.error("Failed to select shops", { category: "api", scheduleId }, error);
    } finally {
      setIsSelectingShops(false);
    }
  };

  // 戻るボタン
  const handleBack = () => {
    if (step === "results") {
      setStep("keywords");
    } else if (step === "keywords") {
      setStep("detail");
      ai.reset();
    }
  };

  // モーダルを閉じる（検索中なら中断）
  const handleClose = () => {
    if (ai.isStreaming) {
      ai.abortStream();
    }
    onClose();
  };

  const getModalTitle = () => {
    switch (step) {
      case "keywords":
        return "AI再検索 - キーワード選択";
      case "results":
        return "AI再検索 - 検索結果";
      default:
        return "予定詳細";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={getModalTitle()} size="lg">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : fullSchedule ? (
        <>
          {step === "detail" && (
            <ScheduleDetail
              schedule={fullSchedule}
              onEdit={() => onEdit(fullSchedule)}
              onDelete={handleDelete}
              onMemoSave={handleMemoSave}
              onResearch={handleResearchStart}
              isDeleting={isDeleting}
              isSavingMemo={memoMutation.isPending}
            />
          )}
          {step === "keywords" && (
            <KeywordSuggestions
              keywords={ai.keywords}
              isLoading={ai.isLoadingKeywords}
              isSearching={ai.isLoadingSearch}
              isRegenerating={ai.isLoadingKeywords}
              onSelect={handleKeywordSelect}
              onSkip={handleBack}
              onRegenerate={handleRegenerateKeywords}
            />
          )}
          {step === "results" && (
            <SearchResults
              result={ai.searchResult}
              shopCandidates={ai.shopCandidates}
              statusMessage={ai.statusMessage}
              isLoading={ai.isLoadingSearch}
              isStreaming={ai.isStreaming}
              isSelectingShops={isSelectingShops}
              onClose={handleClose}
              onBack={handleBack}
              onSelectShops={handleSelectShops}
            />
          )}
        </>
      ) : null}
    </Modal>
  );
};
