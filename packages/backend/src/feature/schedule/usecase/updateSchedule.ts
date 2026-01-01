import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import {
  updateSchedule as updateScheduleEntity,
  toPublicSchedule,
  type UpdateScheduleInput,
} from "../../../domain/model/schedule";
import type { Schedule } from "@ai-scheduler/shared";
import { type Result, ok, err } from "../../../shared/result";
import { createNotFoundError, createDatabaseError } from "../../../shared/errors";

export const createUpdateScheduleUseCase = (repo: ScheduleRepo) => {
  return async (
    id: string,
    userId: string,
    input: UpdateScheduleInput
  ): Promise<Result<Schedule>> => {
    try {
      const existing = await repo.findByIdAndUserId(id, userId);
      if (!existing) {
        return err(createNotFoundError("スケジュール"));
      }

      const updated = updateScheduleEntity(existing, input);
      await repo.update(updated);
      return ok(toPublicSchedule(updated));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type UpdateScheduleUseCase = ReturnType<typeof createUpdateScheduleUseCase>;
