import type { RecurrenceRule } from "@ai-scheduler/shared";
import type { RecurrenceRepo } from "../../../domain/infra/recurrenceRepo";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import {
  type CreateRecurrenceRuleInput,
  createRecurrenceRule,
  toPublicRecurrenceRule,
} from "../../../domain/model/recurrence";
import { createDatabaseError, createNotFoundError } from "../../../shared/errors";
import { type Result, err, ok } from "../../../shared/result";

export const createCreateRecurrenceUseCase = (
  recurrenceRepo: RecurrenceRepo,
  scheduleRepo: ScheduleRepo
) => {
  return async (
    scheduleId: string,
    input: CreateRecurrenceRuleInput,
    userId: string
  ): Promise<Result<RecurrenceRule>> => {
    try {
      // スケジュールの存在と所有権を確認
      const schedule = await scheduleRepo.findByIdAndUserId(scheduleId, userId);
      if (!schedule) {
        return err(createNotFoundError("スケジュールが見つかりません"));
      }

      // 既存のルールがあれば削除
      const existing = await recurrenceRepo.findByScheduleId(scheduleId);
      if (existing) {
        await recurrenceRepo.delete(existing.id);
      }

      const rule = createRecurrenceRule(input, scheduleId);
      await recurrenceRepo.save(rule);

      return ok(toPublicRecurrenceRule(rule));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type CreateRecurrenceUseCase = ReturnType<typeof createCreateRecurrenceUseCase>;
