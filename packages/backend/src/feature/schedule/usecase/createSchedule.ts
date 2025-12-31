import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import {
  createSchedule as createScheduleEntity,
  type Schedule,
  type CreateScheduleInput,
} from "../../../domain/model/schedule";
import { type Result, ok } from "../../../shared/result";

export const createCreateScheduleUseCase = (repo: ScheduleRepo) => {
  return async (input: CreateScheduleInput): Promise<Result<Schedule>> => {
    const schedule = createScheduleEntity(input);
    await repo.save(schedule);
    return ok(schedule);
  };
};

export type CreateScheduleUseCase = ReturnType<typeof createCreateScheduleUseCase>;
