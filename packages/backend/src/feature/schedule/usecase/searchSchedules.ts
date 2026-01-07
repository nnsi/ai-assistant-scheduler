import type { ScheduleRepo, SearchOptions } from "../../../domain/infra/scheduleRepo";
import type { Schedule } from "@ai-scheduler/shared";
import { toPublicSchedule } from "../../../domain/model/schedule";
import { type Result, ok } from "../../../shared/result";

export const createSearchSchedulesUseCase = (repo: ScheduleRepo) => {
  return async (
    userId: string,
    options: SearchOptions
  ): Promise<Result<Schedule[]>> => {
    const schedules = await repo.search(userId, options);
    return ok(schedules.map(toPublicSchedule));
  };
};

export type SearchSchedulesUseCase = ReturnType<typeof createSearchSchedulesUseCase>;
