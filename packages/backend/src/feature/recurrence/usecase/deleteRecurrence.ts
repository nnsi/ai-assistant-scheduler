import type { RecurrenceRepo } from "../../../domain/infra/recurrenceRepo";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import { createDatabaseError, createNotFoundError } from "../../../shared/errors";
import { type Result, err, ok } from "../../../shared/result";

export const createDeleteRecurrenceUseCase = (
  recurrenceRepo: RecurrenceRepo,
  scheduleRepo: ScheduleRepo
) => {
  return async (scheduleId: string, userId: string): Promise<Result<void>> => {
    try {
      // スケジュールの存在と所有権を確認
      const schedule = await scheduleRepo.findByIdAndUserId(scheduleId, userId);
      if (!schedule) {
        return err(createNotFoundError("スケジュールが見つかりません"));
      }

      const existing = await recurrenceRepo.findByScheduleId(scheduleId);
      if (!existing) {
        return err(createNotFoundError("繰り返しルールが見つかりません"));
      }

      await recurrenceRepo.delete(existing.id);
      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type DeleteRecurrenceUseCase = ReturnType<typeof createDeleteRecurrenceUseCase>;
