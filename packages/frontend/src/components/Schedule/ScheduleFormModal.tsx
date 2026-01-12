import { Modal } from "@/components/common/Modal";
import { ScheduleForm } from "./ScheduleForm";
import { KeywordSuggestions } from "@/components/AI/KeywordSuggestions";
import { SearchResults } from "@/components/AI/SearchResults";
import { useScheduleFormModal } from "@ai-scheduler/core/hooks";
import { useCalendarContext } from "@/contexts/CalendarContext";
import { logger } from "@/lib/logger";
import type { Schedule } from "@ai-scheduler/shared";

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
  const { calendars, defaultCalendarId } = useCalendarContext();

  const {
    // 状態
    step,
    // ローディング状態
    isSubmitting,
    isSimpleSaving,
    isRegenerating,
    isSelectingShops,
    // AI 状態
    keywords,
    searchResult,
    shopCandidates,
    statusMessage,
    isLoadingKeywords,
    isLoadingSearch,
    isStreaming,
    // データ
    categories,
    hasConditions,
    // ハンドラー
    handleFormSubmit,
    handleSimpleSave,
    handleKeywordSelect,
    handleRegenerate,
    handleSkip,
    handleSelectShops,
    handleCloseResult,
    handleBack,
    handleClose,
    // 派生値
    title,
  } = useScheduleFormModal({
    calendars,
    defaultCalendarId,
    logger,
    onScheduleCreated,
    onClose,
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
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
          isSelectingShops={isSelectingShops}
          onClose={handleCloseResult}
          onBack={handleBack}
          onSelectShops={handleSelectShops}
        />
      )}
    </Modal>
  );
};
