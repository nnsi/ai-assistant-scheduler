import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import type { Schedule } from "../../../domain/model/schedule";
import { type Result, ok } from "../../../shared/result";

export const createGetSchedulesUseCase = (repo: ScheduleRepo) => {
  return async (year?: number, month?: number): Promise<Result<Schedule[]>> => {
    if (year !== undefined && month !== undefined) {
      const schedules = await repo.findByMonth(year, month);
      return ok(schedules);
    }
    const schedules = await repo.findAll();
    return ok(schedules);
  };
};

export type GetSchedulesUseCase = ReturnType<typeof createGetSchedulesUseCase>;
