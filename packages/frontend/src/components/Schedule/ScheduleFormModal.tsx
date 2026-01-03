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
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    keywords,
    searchResult,
    isLoadingKeywords,
    isLoadingSearch,
    suggestKeywords,
    regenerateKeywords,
    search,
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
      // キーワード提案を取得（スケジュールはまだ作成しない）
      await suggestKeywords(data.title, data.startAt);
      setStep("keywords");
    } catch (error) {
      logger.error("Failed to get keyword suggestions", { category: "ai", title: data.title }, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeywordSelect = async (keywords: string[]) => {
    if (!formData) return;

    setSelectedKeywords(keywords);
    await search(formData.title, formData.startAt, keywords);
    setStep("results");
  };

  const handleRegenerate = async () => {
    if (!formData) return;

    try {
      await regenerateKeywords(formData.title, formData.startAt);
    } catch (error) {
      logger.error("Failed to regenerate keywords", { category: "ai", title: formData.title }, error);
    }
  };

  const handleSkip = async () => {
    if (!formData) return;

    setIsSubmitting(true);
    try {
      // AI結果なしでスケジュールを作成
      const schedule = await api.createSchedule(formData);
      onScheduleCreated(schedule);
      handleClose();
    } catch (error) {
      logger.error("Failed to create schedule (skip)", { category: "api" }, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!formData) return;

    setIsSubmitting(true);
    try {
      // スケジュール＋AI結果を一緒に保存
      const schedule = await api.createSchedule({
        ...formData,
        keywords: selectedKeywords,
        aiResult: searchResult,
      });
      onScheduleCreated(schedule);
      handleClose();
    } catch (error) {
      logger.error("Failed to create schedule", { category: "api" }, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setStep("keywords");
  };

  const handleClose = () => {
    setStep("form");
    setFormData(null);
    setSelectedKeywords([]);
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
          isLoading={isLoadingKeywords}
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
          onSave={handleSave}
          onBack={handleBack}
        />
      )}
    </Modal>
  );
};
