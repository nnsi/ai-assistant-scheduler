import type { RecurrenceRepo } from "../../../domain/infra/recurrenceRepo";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import { toPublicRecurrenceRule } from "../../../domain/model/recurrence";
import type { RecurrenceRule } from "@ai-scheduler/shared";
import { type Result, ok, err } from "../../../shared/result";
import { createDatabaseError, createNotFoundError } from "../../../shared/errors";

export const createGetRecurrenceUseCase = (
  recurrenceRepo: RecurrenceRepo,
  scheduleRepo: ScheduleRepo
) => {
  return async (
    scheduleId: string,
    userId: string
  ): Promise<Result<RecurrenceRule | null>> => {
    try {
      // スケジュールの存在と所有権を確認
      const schedule = await scheduleRepo.findByIdAndUserId(scheduleId, userId);
      if (!schedule) {
        return err(createNotFoundError("スケジュールが見つかりません"));
      }

      const rule = await recurrenceRepo.findByScheduleId(scheduleId);
      return ok(rule ? toPublicRecurrenceRule(rule) : null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type GetRecurrenceUseCase = ReturnType<typeof createGetRecurrenceUseCase>;
