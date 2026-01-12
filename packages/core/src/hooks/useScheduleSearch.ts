import { useQuery } from "@tanstack/react-query";
import type { Schedule, SearchScheduleInput } from "@ai-scheduler/shared";
import { searchSchedules } from "../api";

/**
 * スケジュール検索のビジネスロジックhook
 *
 * テキスト検索、日付範囲、カテゴリでスケジュールを検索する。
 * TanStack Queryでキャッシュ管理を行う。
 */
export const useScheduleSearch = (params: SearchScheduleInput, enabled = true) => {
  const { data: schedules = [], isLoading, error, refetch } = useQuery<Schedule[]>({
    queryKey: [
      "search-schedules",
      params.query,
      params.startDate,
      params.endDate,
      params.categoryId,
    ],
    queryFn: () => searchSchedules(params),
    enabled,
  });

  return {
    schedules,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
