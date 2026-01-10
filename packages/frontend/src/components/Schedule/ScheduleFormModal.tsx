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
import type { ScheduleContext } from "@/lib/api";
import { logger } from "@/lib/logger";
import type { Schedule, CreateScheduleInput, ShopList, CreateRecurrenceRuleInput } from "@ai-scheduler/shared";
import { DAY_OF_WEEK_LABELS, FREQUENCY_LABELS } from "@ai-scheduler/shared";

// 繰り返しルールから人間が読める説明を生成
const buildRecurrenceSummary = (recurrence: CreateRecurrenceRuleInput | null | undefined): string | undefined => {
  if (!recurrence) return undefined;

  const { frequency, interval, daysOfWeek, dayOfMonth, weekOfMonth, endType, endDate, endCount } = recurrence;
  const parts: string[] = [];

  // 頻度とインターバル
  if (interval === 1) {
    parts.push(FREQUENCY_LABELS[frequency]);
  } else {
    // "2週間ごと" のような表現
    const unit = frequency === "daily" ? "日" : frequency === "weekly" ? "週" : frequency === "monthly" ? "ヶ月" : "年";
    parts.push(`${interval}${unit}ごと`);
  }

  // 曜日（weekly の場合）
  if (frequency === "weekly" && daysOfWeek && daysOfWeek.length > 0) {
    const dayNames = daysOfWeek.map((d) => DAY_OF_WEEK_LABELS[d]).join("・");
    parts.push(`（${dayNames}曜日）`);
  }

  // 日付（monthly の場合）
  if (frequency === "monthly") {
    if (weekOfMonth !== undefined && weekOfMonth !== null && daysOfWeek && daysOfWeek.length > 0) {
      const weekLabel = weekOfMonth === -1 ? "最終" : `第${weekOfMonth}`;
      const dayName = DAY_OF_WEEK_LABELS[daysOfWeek[0]];
      parts.push(`（${weekLabel}${dayName}曜日）`);
    } else if (dayOfMonth) {
      parts.push(`（${dayOfMonth}日）`);
    }
  }

  // 終了条件
  if (endType === "date" && endDate) {
    parts.push(`、${endDate}まで`);
  } else if (endType === "count" && endCount) {
    parts.push(`、${endCount}回まで`);
  }

  return parts.join("");
};

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
  const [isSelectingShops, setIsSelectingShops] = useState(false);

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

      // AIエージェントに渡す追加コンテキストを構築
      const scheduleContext: ScheduleContext = {
        endAt: scheduleData.endAt,
        userMemo: scheduleData.userMemo,
        recurrenceSummary: buildRecurrenceSummary(recurrence),
      };

      // スケジュールを即座に保存し、キーワード提案を並行取得
      const [schedule] = await Promise.all([
        api.createSchedule(scheduleData),
        suggestKeywords(scheduleData.title, scheduleData.startAt, undefined, scheduleContext),
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

    // AIエージェントに渡す追加コンテキストを構築
    const scheduleContext: ScheduleContext = {
      endAt: formData.endAt,
      userMemo: formData.userMemo,
      recurrenceSummary: buildRecurrenceSummary(formData.recurrence),
    };

    // ストリーミング検索を開始して結果画面に遷移
    setStep("results");
    // 検索＋保存を実行（ストリーミングで結果を表示しつつ、完了時に自動保存）
    await searchAndSaveStream(createdSchedule.id, formData.title, formData.startAt, keywords, scheduleContext);
  };

  const handleRegenerate = async () => {
    if (!formData) return;

    // AIエージェントに渡す追加コンテキストを構築
    const scheduleContext: ScheduleContext = {
      endAt: formData.endAt,
      userMemo: formData.userMemo,
      recurrenceSummary: buildRecurrenceSummary(formData.recurrence),
    };

    setIsRegenerating(true);
    try {
      await regenerateKeywords(formData.title, formData.startAt, scheduleContext);
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

  const handleSelectShops = async (shops: ShopList) => {
    if (!createdSchedule) return;

    setIsSelectingShops(true);
    try {
      await api.selectShops(createdSchedule.id, shops);
    } catch (error) {
      logger.error("Failed to select shops", { category: "api", count: shops.length }, error);
    } finally {
      setIsSelectingShops(false);
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
          isSelectingShops={isSelectingShops}
          onClose={handleCloseResult}
          onBack={handleBack}
          onSelectShops={handleSelectShops}
        />
      )}
    </Modal>
  );
};
