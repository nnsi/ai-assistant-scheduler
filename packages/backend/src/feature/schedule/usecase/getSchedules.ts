import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import type { Schedule } from "@ai-scheduler/shared";
import { toPublicSchedule } from "../../../domain/model/schedule";
import { type Result, ok } from "../../../shared/result";

export const createGetSchedulesUseCase = (repo: ScheduleRepo) => {
  return async (
    userId: string,
    year?: number,
    month?: number
  ): Promise<Result<Schedule[]>> => {
    if (year !== undefined && month !== undefined) {
      const schedules = await repo.findByMonthAndUserId(year, month, userId);
      return ok(schedules.map(toPublicSchedule));
    }
    const schedules = await repo.findAllByUserId(userId);
    return ok(schedules.map(toPublicSchedule));
  };
};

export type GetSchedulesUseCase = ReturnType<typeof createGetSchedulesUseCase>;
