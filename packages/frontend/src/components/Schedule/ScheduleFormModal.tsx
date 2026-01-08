import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { ScheduleForm } from "./ScheduleForm";
import { KeywordSuggestions } from "@/components/AI/KeywordSuggestions";
import { SearchResults } from "@/components/AI/SearchResults";
import { useAI } from "@/hooks/useAI";
import { useProfile } from "@/hooks/useProfile";
import { useCategories } from "@/hooks/useCategories";
import { useCalendarContext } from "@/contexts/CalendarContext";
import * as api from "@/lib/api";
import { logger } from "@/lib/logger";
import type { Schedule, CreateScheduleInput, Shop, CreateRecurrenceRuleInput } from "@ai-scheduler/shared";

type FormData = CreateScheduleInput & {
  recurrence?: CreateRecurrenceRuleInput | null;
};

type Step = "form" | "keywords" | "results";

type ScheduleFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
  defaultTime?: string;
  onScheduleCreated: (schedule: Schedule) => void;
};

export const ScheduleFormModal = ({
  isOpen,
  onClose,
  defaultDate,
  defaultTime,
  onScheduleCreated,
}: ScheduleFormModalProps) => {
  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState<FormData | null>(null);
  const [createdSchedule, setCreatedSchedule] = useState<Schedule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSimpleSaving, setIsSimpleSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const {
    keywords,
    searchResult,
    shopCandidates,
    statusMessage,
    isLoadingKeywords,
    isLoadingSearch,
    isStreaming,
    suggestKeywords,
    regenerateKeywords,
    searchAndSaveStream,
    abortStream,
    reset,
  } = useAI();
  const [isSelectingShop, setIsSelectingShop] = useState(false);

  const { profile } = useProfile();
  const { categories } = useCategories();
  const { calendars, defaultCalendarId } = useCalendarContext();

  // こだわり条件が設定されているかどうか
  const hasConditions = Boolean(
    profile?.requiredConditions?.trim() ||
    profile?.preferredConditions?.trim() ||
    profile?.subjectiveConditions?.trim()
  );

  const handleFormSubmit = async (data: FormData) => {
    setFormData(data);
    setIsSubmitting(true);

    try {
      // スケジュールデータから繰り返しを除外
      const { recurrence, ...scheduleData } = data;

      // スケジュールを即座に保存し、キーワード提案を並行取得
      const [schedule] = await Promise.all([
        api.createSchedule(scheduleData),
        suggestKeywords(scheduleData.title, scheduleData.startAt),
      ]);

      // 繰り返しルールがあれば作成
      if (recurrence) {
        try {
          await api.createRecurrence(schedule.id, recurrence);
        } catch (error) {
          logger.error("Failed to create recurrence rule", { category: "api", scheduleId: schedule.id }, error);
        }
      }

      setCreatedSchedule(schedule);
      setStep("keywords");
    } catch (error) {
      logger.error("Failed to create schedule or get keyword suggestions", { category: "api", title: data.title }, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimpleSave = async (data: FormData) => {
    setIsSimpleSaving(true);

    try {
      // スケジュールデータから繰り返しを除外
      const { recurrence, ...scheduleData } = data;

      // スケジュールを保存（AI補完なし）
      const schedule = await api.createSchedule(scheduleData);

      // 繰り返しルールがあれば作成
      if (recurrence) {
        try {
          await api.createRecurrence(schedule.id, recurrence);
        } catch (error) {
          logger.error("Failed to create recurrence rule", { category: "api", scheduleId: schedule.id }, error);
        }
      }

      // 保存完了、モーダルを閉じる
      onScheduleCreated(schedule);
      onClose();
    } catch (error) {
      logger.error("Failed to create schedule", { category: "api", title: data.title }, error);
    } finally {
      setIsSimpleSaving(false);
    }
  };

  const handleKeywordSelect = async (keywords: string[]) => {
    if (!formData || !createdSchedule) return;

    // ストリーミング検索を開始して結果画面に遷移
    setStep("results");
    // 検索＋保存を実行（ストリーミングで結果を表示しつつ、完了時に自動保存）
    await searchAndSaveStream(createdSchedule.id, formData.title, formData.startAt, keywords);
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

  const handleSelectShop = async (shop: Shop) => {
    if (!createdSchedule) return;

    setIsSelectingShop(true);
    try {
      await api.selectShop(createdSchedule.id, shop);
    } catch (error) {
      logger.error("Failed to select shop", { category: "api", shopName: shop.name }, error);
    } finally {
      setIsSelectingShop(false);
    }
  };

  const handleCloseResult = () => {
    // AI検索結果は既に保存済みなので、モーダルを閉じるだけ
    handleClose();
  };

  const handleBack = () => {
    setStep("keywords");
  };

  const handleClose = () => {
    // ストリーミング中なら中断
    abortStream();
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
          defaultTime={defaultTime}
          categories={categories}
          calendars={calendars}
          defaultCalendarId={defaultCalendarId}
          onSubmit={handleFormSubmit}
          onSimpleSave={handleSimpleSave}
          onCancel={handleClose}
          isLoading={isSubmitting}
          isSimpleSaving={isSimpleSaving}
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
          shopCandidates={shopCandidates}
          statusMessage={statusMessage}
          isLoading={isLoadingSearch}
          isStreaming={isStreaming}
          isSelectingShop={isSelectingShop}
          onClose={handleCloseResult}
          onBack={handleBack}
          onSelectShop={handleSelectShop}
        />
      )}
    </Modal>
  );
};
