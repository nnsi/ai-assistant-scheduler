import type {
  CreateRecurrenceRuleInput,
  CreateScheduleInput,
  Schedule,
  ShopList,
} from "@ai-scheduler/shared";
import { DAY_OF_WEEK_LABELS, FREQUENCY_LABELS } from "@ai-scheduler/shared";
import { useCallback, useState } from "react";
import type { ScheduleContext } from "../api";
import type { Logger } from "../utils/logger";
import { useAI } from "./useAI";
import { useCategories } from "./useCategories";
import { useProfile } from "./useProfile";
import { useRecurrence } from "./useRecurrence";
import { useSchedules } from "./useSchedules";
import { useSupplements } from "./useSupplements";

/**
 * 繰り返しルールから人間が読める説明を生成
 */
const buildRecurrenceSummary = (
  recurrence: CreateRecurrenceRuleInput | null | undefined
): string | undefined => {
  if (!recurrence) return undefined;

  const { frequency, interval, daysOfWeek, dayOfMonth, weekOfMonth, endType, endDate, endCount } =
    recurrence;
  const parts: string[] = [];

  // 頻度とインターバル
  if (interval === 1) {
    parts.push(FREQUENCY_LABELS[frequency]);
  } else {
    // "2週間ごと" のような表現
    const unit =
      frequency === "daily"
        ? "日"
        : frequency === "weekly"
          ? "週"
          : frequency === "monthly"
            ? "ヶ月"
            : "年";
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

export type ScheduleFormData = CreateScheduleInput & {
  recurrence?: CreateRecurrenceRuleInput | null;
};

export type ScheduleFormStep = "form" | "keywords" | "results";

export type UseScheduleFormModalConfig = {
  /** カレンダーID一覧 */
  calendars: { id: string }[];
  /** デフォルトカレンダーID */
  defaultCalendarId: string | null;
  /** ロガー */
  logger: Logger;
  /** スケジュール作成後のコールバック */
  onScheduleCreated: (schedule: Schedule) => void;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
};

/**
 * ScheduleFormModal の UI ロジックを管理するカスタムフック
 *
 * プラットフォーム非依存のUIロジックを提供し、
 * Web/React Native で共通のステップ管理・ハンドラーを使用できる。
 */
export function useScheduleFormModal(config: UseScheduleFormModalConfig) {
  const { logger, onScheduleCreated, onClose } = config;

  // ステップ管理
  const [step, setStep] = useState<ScheduleFormStep>("form");
  const [formData, setFormData] = useState<ScheduleFormData | null>(null);
  const [createdSchedule, setCreatedSchedule] = useState<Schedule | null>(null);

  // ローディング状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSimpleSaving, setIsSimpleSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // ビジネスロジックHooks
  const { create: createSchedule } = useSchedules();
  const { create: createRecurrence } = useRecurrence(null);
  const { selectShops, isSelectingShops } = useSupplements();

  // AI機能
  const ai = useAI();

  // プロフィール（こだわり条件）
  const { profile } = useProfile();

  // カテゴリ
  const { categories } = useCategories();

  // こだわり条件が設定されているかどうか
  const hasConditions = Boolean(
    profile?.requiredConditions?.trim() ||
      profile?.preferredConditions?.trim() ||
      profile?.subjectiveConditions?.trim()
  );

  /**
   * フォーム送信時のハンドラー（AI補完あり）
   * スケジュールを保存し、キーワード提案に進む
   */
  const handleFormSubmit = useCallback(
    async (data: ScheduleFormData) => {
      setFormData(data);
      setIsSubmitting(true);

      try {
        const { recurrence, ...scheduleData } = data;

        // AIエージェントに渡す追加コンテキスト
        const scheduleContext: ScheduleContext = {
          endAt: scheduleData.endAt,
          userMemo: scheduleData.userMemo,
          recurrenceSummary: buildRecurrenceSummary(recurrence),
        };

        // スケジュールを即座に保存し、キーワード提案を並行取得
        const [schedule] = await Promise.all([
          createSchedule(scheduleData),
          ai.suggestKeywords(scheduleData.title, scheduleData.startAt, undefined, scheduleContext),
        ]);

        // 繰り返しルールがあれば作成
        if (recurrence) {
          try {
            await createRecurrence(schedule.id, recurrence);
          } catch (error) {
            logger.error(
              "Failed to create recurrence rule",
              { category: "api", scheduleId: schedule.id },
              error
            );
          }
        }

        setCreatedSchedule(schedule);
        setStep("keywords");
      } catch (error) {
        logger.error(
          "Failed to create schedule or get keyword suggestions",
          { category: "api", title: data.title },
          error
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [createSchedule, createRecurrence, ai, logger]
  );

  /**
   * シンプル保存（AI補完なし）
   */
  const handleSimpleSave = useCallback(
    async (data: ScheduleFormData) => {
      setIsSimpleSaving(true);

      try {
        const { recurrence, ...scheduleData } = data;
        const schedule = await createSchedule(scheduleData);

        // 繰り返しルールがあれば作成
        if (recurrence) {
          try {
            await createRecurrence(schedule.id, recurrence);
          } catch (error) {
            logger.error(
              "Failed to create recurrence rule",
              { category: "api", scheduleId: schedule.id },
              error
            );
          }
        }

        onScheduleCreated(schedule);
        onClose();
      } catch (error) {
        logger.error("Failed to create schedule", { category: "api", title: data.title }, error);
      } finally {
        setIsSimpleSaving(false);
      }
    },
    [createSchedule, createRecurrence, logger, onScheduleCreated, onClose]
  );

  /**
   * キーワード選択後のハンドラー
   */
  const handleKeywordSelect = useCallback(
    async (keywords: string[]) => {
      if (!formData || !createdSchedule) return;

      const scheduleContext: ScheduleContext = {
        endAt: formData.endAt,
        userMemo: formData.userMemo,
        recurrenceSummary: buildRecurrenceSummary(formData.recurrence),
      };

      setStep("results");
      await ai.searchAndSaveStream(
        createdSchedule.id,
        formData.title,
        formData.startAt,
        keywords,
        scheduleContext
      );
    },
    [formData, createdSchedule, ai]
  );

  /**
   * キーワード再生成
   */
  const handleRegenerate = useCallback(async () => {
    if (!formData) return;

    const scheduleContext: ScheduleContext = {
      endAt: formData.endAt,
      userMemo: formData.userMemo,
      recurrenceSummary: buildRecurrenceSummary(formData.recurrence),
    };

    setIsRegenerating(true);
    try {
      await ai.regenerateKeywords(formData.title, formData.startAt, scheduleContext);
    } catch (error) {
      logger.error(
        "Failed to regenerate keywords",
        { category: "ai", title: formData.title },
        error
      );
    } finally {
      setIsRegenerating(false);
    }
  }, [formData, ai, logger]);

  /**
   * スキップ（キーワード画面からAI補完なしで完了）
   */
  const handleSkip = useCallback(() => {
    handleClose();
  }, []);

  /**
   * お店選択
   */
  const handleSelectShops = useCallback(
    async (shops: ShopList) => {
      if (!createdSchedule) return;

      try {
        await selectShops(createdSchedule.id, shops);
      } catch (error) {
        logger.error("Failed to select shops", { category: "api", count: shops.length }, error);
      }
    },
    [createdSchedule, selectShops, logger]
  );

  /**
   * 結果画面を閉じる
   */
  const handleCloseResult = useCallback(() => {
    handleClose();
  }, []);

  /**
   * 結果画面から戻る
   */
  const handleBack = useCallback(() => {
    setStep("keywords");
  }, []);

  /**
   * モーダルを閉じる
   */
  const handleClose = useCallback(() => {
    ai.abortStream();
    if (createdSchedule) {
      onScheduleCreated(createdSchedule);
    }
    setStep("form");
    setFormData(null);
    setCreatedSchedule(null);
    setIsRegenerating(false);
    ai.reset();
    onClose();
  }, [ai, createdSchedule, onScheduleCreated, onClose]);

  /**
   * 現在のステップに応じたタイトル
   */
  const getTitle = useCallback(() => {
    switch (step) {
      case "form":
        return "新しい予定を作成";
      case "keywords":
        return "キーワード選択";
      case "results":
        return "検索結果";
    }
  }, [step]);

  return {
    // 状態
    step,
    formData,
    createdSchedule,

    // ローディング状態
    isSubmitting,
    isSimpleSaving,
    isRegenerating,
    isSelectingShops,

    // AI 状態
    keywords: ai.keywords,
    searchResult: ai.searchResult,
    shopCandidates: ai.shopCandidates,
    statusMessage: ai.statusMessage,
    isLoadingKeywords: ai.isLoadingKeywords,
    isLoadingSearch: ai.isLoadingSearch,
    isStreaming: ai.isStreaming,

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
    title: getTitle(),
  };
}
