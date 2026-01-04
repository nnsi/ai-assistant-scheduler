import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { ScheduleForm } from "./ScheduleForm";
import { KeywordSuggestions } from "@/components/AI/KeywordSuggestions";
import { SearchResults } from "@/components/AI/SearchResults";
import { useAI } from "@/hooks/useAI";
import { useProfile } from "@/hooks/useProfile";
import * as api from "@/lib/api";
import { logger } from "@/lib/logger";
import type { Schedule, CreateScheduleInput } from "@ai-scheduler/shared";

type Step = "form" | "keywords" | "results";

type ScheduleFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
  onScheduleCreated: (schedule: Schedule) => void;
};

export const ScheduleFormModal = ({
  isOpen,
  onClose,
  defaultDate,
  onScheduleCreated,
}: ScheduleFormModalProps) => {
  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState<CreateScheduleInput | null>(null);
  const [createdSchedule, setCreatedSchedule] = useState<Schedule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const {
    keywords,
    searchResult,
    isLoadingKeywords,
    isLoadingSearch,
    suggestKeywords,
    regenerateKeywords,
    searchAndSave,
    reset,
  } = useAI();

  const { profile } = useProfile();

  // こだわり条件が設定されているかどうか
  const hasConditions = Boolean(
    profile?.requiredConditions?.trim() ||
    profile?.preferredConditions?.trim() ||
    profile?.subjectiveConditions?.trim()
  );

  const handleFormSubmit = async (data: CreateScheduleInput) => {
    setFormData(data);
    setIsSubmitting(true);

    try {
      // スケジュールを即座に保存し、キーワード提案を並行取得
      const [schedule] = await Promise.all([
        api.createSchedule(data),
        suggestKeywords(data.title, data.startAt),
      ]);
      setCreatedSchedule(schedule);
      setStep("keywords");
    } catch (error) {
      logger.error("Failed to create schedule or get keyword suggestions", { category: "api", title: data.title }, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeywordSelect = async (keywords: string[]) => {
    if (!formData || !createdSchedule) return;

    // 検索＋保存を実行（結果が返り次第自動保存される）
    await searchAndSave(createdSchedule.id, formData.title, formData.startAt, keywords);
    setStep("results");
  };

  const handleRegenerate = async () => {
    if (!formData) return;

    setIsRegenerating(true);
    try {
      await regenerateKeywords(formData.title, formData.startAt);
    } catch (error) {
      logger.error("Failed to regenerate keywords", { category: "ai", title: formData.title }, error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSkip = () => {
    // スケジュールは既に保存済みなので、モーダルを閉じるだけ
    handleClose();
  };

  const handleCloseResult = () => {
    // AI検索結果は既に保存済みなので、モーダルを閉じるだけ
    handleClose();
  };

  const handleBack = () => {
    setStep("keywords");
  };

  const handleClose = () => {
    // スケジュールが作成されていれば通知（カレンダー更新のため）
    if (createdSchedule) {
      onScheduleCreated(createdSchedule);
    }
    setStep("form");
    setFormData(null);
    setCreatedSchedule(null);
    setIsRegenerating(false);
    reset();
    onClose();
  };

  const getTitle = () => {
    switch (step) {
      case "form":
        return "新しい予定を作成";
      case "keywords":
        return "キーワード選択";
      case "results":
        return "検索結果";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={getTitle()} size="md">
      {step === "form" && (
        <ScheduleForm
          defaultDate={defaultDate}
          onSubmit={handleFormSubmit}
          onCancel={handleClose}
          isLoading={isSubmitting}
        />
      )}
      {step === "keywords" && (
        <KeywordSuggestions
          keywords={keywords}
          isLoading={isLoadingKeywords && !isRegenerating}
          isSearching={isLoadingSearch}
          isRegenerating={isRegenerating}
          hasConditions={hasConditions}
          onSelect={handleKeywordSelect}
          onSkip={handleSkip}
          onRegenerate={handleRegenerate}
        />
      )}
      {step === "results" && (
        <SearchResults
          result={searchResult}
          isLoading={isLoadingSearch}
          onClose={handleCloseResult}
          onBack={handleBack}
        />
      )}
    </Modal>
  );
};
