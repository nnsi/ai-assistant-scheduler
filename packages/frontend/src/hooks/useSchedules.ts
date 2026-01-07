import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { Schedule, CreateScheduleInput, UpdateScheduleInput } from "@ai-scheduler/shared";
import { expandRecurringSchedules, type ScheduleOccurrence } from "@/lib/recurrence";
import { startOfMonth, endOfMonth, addMonths, subMonths } from "@/lib/date";

const SCHEDULES_QUERY_KEY = "schedules";

export const useSchedules = (year?: number, month?: number) => {
  const queryClient = useQueryClient();

  const queryKey = [SCHEDULES_QUERY_KEY, year, month];

  const { data: rawSchedules = [], isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => api.fetchSchedules(year, month),
  });

  // 繰り返しスケジュールを展開
  const schedules = useMemo<ScheduleOccurrence[]>(() => {
    if (!year || !month) {
      // year/monthが指定されていない場合は展開しない
      return rawSchedules.map((s) => ({
        ...s,
        isRecurring: false,
        occurrenceDate: new Date(s.startAt),
        originalScheduleId: s.id,
      }));
    }

    // 表示範囲を計算（前後1ヶ月を含めて繰り返しを正しく表示）
    const baseDate = new Date(year, month - 1, 1);
    const rangeStart = subMonths(startOfMonth(baseDate), 1);
    const rangeEnd = addMonths(endOfMonth(baseDate), 1);

    return expandRecurringSchedules(rawSchedules, rangeStart, rangeEnd);
  }, [rawSchedules, year, month]);

  const createMutation = useMutation({
    mutationFn: (input: CreateScheduleInput) => api.createSchedule(input),
    onSuccess: (newSchedule) => {
      queryClient.setQueryData<Schedule[]>(queryKey, (old) =>
        old ? [...old, newSchedule] : [newSchedule]
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateScheduleInput }) =>
      api.updateSchedule(id, input),
    onSuccess: (updatedSchedule) => {
      queryClient.setQueryData<Schedule[]>(queryKey, (old) =>
        old?.map((s) => (s.id === updatedSchedule.id ? updatedSchedule : s)) ?? []
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.deleteSchedule(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Schedule[]>(queryKey, (old) =>
        old?.filter((s) => s.id !== id) ?? []
      );
    },
  });

  const create = async (input: CreateScheduleInput): Promise<Schedule> => {
    return createMutation.mutateAsync(input);
  };

  const update = async (id: string, input: UpdateScheduleInput): Promise<Schedule> => {
    return updateMutation.mutateAsync({ id, input });
  };

  const remove = async (id: string): Promise<void> => {
    await removeMutation.mutateAsync(id);
  };

  return {
    schedules,
    isLoading,
    error: error as Error | null,
    create,
    update,
    remove,
    refetch,
  };
};
