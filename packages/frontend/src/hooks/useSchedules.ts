import { useState, useEffect, useCallback } from "react";
import * as api from "@/lib/api";
import type { Schedule, CreateScheduleInput, UpdateScheduleInput } from "@ai-scheduler/shared";

export const useSchedules = (year?: number, month?: number) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.fetchSchedules(year, month);
      setSchedules(data);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = async (input: CreateScheduleInput): Promise<Schedule> => {
    const schedule = await api.createSchedule(input);
    setSchedules((prev) => [...prev, schedule]);
    return schedule;
  };

  const update = async (
    id: string,
    input: UpdateScheduleInput
  ): Promise<Schedule> => {
    const schedule = await api.updateSchedule(id, input);
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? schedule : s))
    );
    return schedule;
  };

  const remove = async (id: string): Promise<void> => {
    await api.deleteSchedule(id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  return {
    schedules,
    isLoading,
    error,
    create,
    update,
    remove,
    refetch: fetchAll,
  };
};
