import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { ScheduleForm } from "./ScheduleForm";
import { KeywordSuggestions } from "@/components/AI/KeywordSuggestions";
import { SearchResults } from "@/components/AI/SearchResults";
import { useAI } from "@/hooks/useAI";
import * as api from "@/lib/api";
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

  const {
    keywords,
    searchResult,
    isLoadingKeywords,
    isLoadingSearch,
    suggestKeywords,
    search,
    reset,
  } = useAI();

  const handleFormSubmit = async (data: CreateScheduleInput) => {
    setFormData(data);
    setIsSubmitting(true);

    try {
      // スケジュールを作成
      const schedule = await api.createSchedule(data);
      setCreatedSchedule(schedule);

      // キーワード提案を取得
      await suggestKeywords(data.title, data.startAt);
      setStep("keywords");
    } catch (error) {
      console.error("Failed to create schedule:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeywordSelect = async (keywords: string[]) => {
    if (!createdSchedule || !formData) return;

    await search(createdSchedule.id, formData.title, formData.startAt, keywords);
    setStep("results");
  };

  const handleSkip = () => {
    if (createdSchedule) {
      onScheduleCreated(createdSchedule);
    }
    handleClose();
  };

  const handleSave = () => {
    if (createdSchedule) {
      onScheduleCreated(createdSchedule);
    }
    handleClose();
  };

  const handleBack = () => {
    setStep("keywords");
  };

  const handleClose = () => {
    setStep("form");
    setFormData(null);
    setCreatedSchedule(null);
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
          onSelect={handleKeywordSelect}
          onSkip={handleSkip}
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
