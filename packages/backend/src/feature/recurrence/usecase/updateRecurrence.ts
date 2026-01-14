import type { RecurrenceRule } from "@ai-scheduler/shared";
import type { RecurrenceRepo } from "../../../domain/infra/recurrenceRepo";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import {
  type UpdateRecurrenceRuleInput,
  toPublicRecurrenceRule,
  updateRecurrenceRule,
} from "../../../domain/model/recurrence";
import { createDatabaseError, createNotFoundError } from "../../../shared/errors";
import { type Result, err, ok } from "../../../shared/result";

export const createUpdateRecurrenceUseCase = (
  recurrenceRepo: RecurrenceRepo,
  scheduleRepo: ScheduleRepo
) => {
  return async (
    scheduleId: string,
    input: UpdateRecurrenceRuleInput,
    userId: string
  ): Promise<Result<RecurrenceRule>> => {
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

      const updated = updateRecurrenceRule(existing, input);
      await recurrenceRepo.update(updated);

      return ok(toPublicRecurrenceRule(updated));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type UpdateRecurrenceUseCase = ReturnType<typeof createUpdateRecurrenceUseCase>;
