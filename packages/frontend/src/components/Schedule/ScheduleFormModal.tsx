import { KeywordSuggestions } from "@/components/AI/KeywordSuggestions";
import { SearchResults } from "@/components/AI/SearchResults";
import { Modal } from "@/components/common/Modal";
import { useCalendarContext } from "@/contexts/CalendarContext";
import { logger } from "@/lib/logger";
import { useScheduleFormModal } from "@ai-scheduler/core/hooks";
import type { Schedule } from "@ai-scheduler/shared";
import { ScheduleForm } from "./ScheduleForm";

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
    error,
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
    aiError,
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
    clearError,
    clearAiError,
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
        <>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center justify-between">
              <span className="text-sm text-red-700">{error.message}</span>
              <button
                type="button"
                onClick={clearError}
                className="ml-2 text-red-500 hover:text-red-700"
                aria-label="エラーを閉じる"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
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
        </>
      )}
      {step === "keywords" && (
        <KeywordSuggestions
          keywords={keywords}
          isLoading={isLoadingKeywords && !isRegenerating}
          isSearching={isLoadingSearch}
          isRegenerating={isRegenerating}
          hasConditions={hasConditions}
          error={aiError}
          onSelect={handleKeywordSelect}
          onSkip={handleSkip}
          onRegenerate={handleRegenerate}
          onClearError={clearAiError}
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
          error={aiError}
          onClose={handleCloseResult}
          onBack={handleBack}
          onSelectShops={handleSelectShops}
          onClearError={clearAiError}
        />
      )}
    </Modal>
  );
};
