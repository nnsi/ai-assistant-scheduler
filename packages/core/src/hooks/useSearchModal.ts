import { useState, useCallback, useMemo } from "react";
import type { Schedule } from "@ai-scheduler/shared";
import { useScheduleSearch } from "./useScheduleSearch";
import { useCategories } from "./useCategories";

export type UseSearchModalConfig = {
  /** スケジュールがクリックされた時のコールバック */
  onScheduleClick: (schedule: Schedule) => void;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
};

/**
 * SearchModal の UI ロジックを管理するカスタムフック
 *
 * プラットフォーム非依存のUIロジックを提供し、
 * Web/React Native で共通のフィルタリング・検索ロジックを使用できる。
 */
export function useSearchModal(config: UseSearchModalConfig) {
  const { onScheduleClick, onClose } = config;

  // フィルター状態
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  // カテゴリ
  const { categories } = useCategories();

  // フィルターが設定されているか
  const hasFilters = useMemo(
    () => !!(query || startDate || endDate || categoryId),
    [query, startDate, endDate, categoryId]
  );

  // 検索（ビジネスロジックhook経由）
  const {
    schedules: results,
    isLoading,
    refetch,
  } = useScheduleSearch(
    {
      query: query || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      categoryId,
    },
    hasFilters
  );

  /**
   * 検索を実行
   */
  const handleSearch = useCallback(() => {
    refetch();
  }, [refetch]);

  /**
   * フィルターをクリア
   */
  const handleClear = useCallback(() => {
    setQuery("");
    setStartDate("");
    setEndDate("");
    setCategoryId(undefined);
  }, []);

  /**
   * スケジュールを選択
   */
  const handleScheduleSelect = useCallback(
    (schedule: Schedule) => {
      onScheduleClick(schedule);
      onClose();
    },
    [onScheduleClick, onClose]
  );

  return {
    // フィルター状態
    query,
    setQuery,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    categoryId,
    setCategoryId,

    // 検索状態
    results,
    isLoading,
    hasFilters,

    // データ
    categories,

    // ハンドラー
    handleSearch,
    handleClear,
    handleScheduleSelect,
  };
}
