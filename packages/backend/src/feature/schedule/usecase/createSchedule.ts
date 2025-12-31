import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import type { SupplementRepo } from "../../../domain/infra/supplementRepo";
import {
  createSchedule as createScheduleEntity,
  type Schedule,
  type CreateScheduleInput,
} from "../../../domain/model/schedule";
import { createSupplement } from "../../../domain/model/supplement";
import { type Result, ok, err } from "../../../shared/result";
import { createDatabaseError } from "../../../shared/errors";

export const createCreateScheduleUseCase = (
  scheduleRepo: ScheduleRepo,
  supplementRepo: SupplementRepo
) => {
  return async (input: CreateScheduleInput): Promise<Result<Schedule>> => {
    try {
      const schedule = createScheduleEntity(input);
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

      return ok(schedule);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type CreateScheduleUseCase = ReturnType<typeof createCreateScheduleUseCase>;
