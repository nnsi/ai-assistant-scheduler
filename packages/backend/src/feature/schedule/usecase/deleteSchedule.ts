import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import { createDatabaseError, createNotFoundError } from "../../../shared/errors";
import { type Result, err, ok } from "../../../shared/result";

export const createDeleteScheduleUseCase = (repo: ScheduleRepo) => {
  return async (id: string, userId: string): Promise<Result<void>> => {
    try {
      const existing = await repo.findByIdAndUserId(id, userId);
      if (!existing) {
        return err(createNotFoundError("スケジュール"));
      }

      await repo.delete(id);
      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type DeleteScheduleUseCase = ReturnType<typeof createDeleteScheduleUseCase>;
