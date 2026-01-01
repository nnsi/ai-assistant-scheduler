import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import type { SupplementRepo } from "../../../domain/infra/supplementRepo";
import {
  createSchedule as createScheduleEntity,
  toPublicSchedule,
  type CreateScheduleInput,
} from "../../../domain/model/schedule";
import type { Schedule } from "@ai-scheduler/shared";
import { createSupplement } from "../../../domain/model/supplement";
import { type Result, ok, err } from "../../../shared/result";
import { createDatabaseError } from "../../../shared/errors";

export const createCreateScheduleUseCase = (
  scheduleRepo: ScheduleRepo,
  supplementRepo: SupplementRepo
) => {
  return async (
    input: CreateScheduleInput,
    userId: string
  ): Promise<Result<Schedule>> => {
    try {
      const schedule = createScheduleEntity(input, userId);
      await scheduleRepo.save(schedule);

      // AI検索結果がある場合は補足情報も作成
      if (input.keywords && input.aiResult) {
        const supplement = createSupplement({
          scheduleId: schedule.id,
          keywords: input.keywords,
          aiResult: input.aiResult,
        });
        await supplementRepo.save(supplement);
      }

      return ok(toPublicSchedule(schedule));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type CreateScheduleUseCase = ReturnType<typeof createCreateScheduleUseCase>;
