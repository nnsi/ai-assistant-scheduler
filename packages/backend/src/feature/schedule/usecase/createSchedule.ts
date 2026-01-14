import type { Schedule } from "@ai-scheduler/shared";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import type { SupplementRepo } from "../../../domain/infra/supplementRepo";
import {
  type CreateScheduleInput,
  createSchedule as createScheduleEntity,
  toPublicSchedule,
} from "../../../domain/model/schedule";
import { createSupplement, createSupplementForMemo } from "../../../domain/model/supplement";
import { createDatabaseError } from "../../../shared/errors";
import { type Result, err, ok } from "../../../shared/result";

export const createCreateScheduleUseCase = (
  scheduleRepo: ScheduleRepo,
  supplementRepo: SupplementRepo
) => {
  return async (input: CreateScheduleInput, userId: string): Promise<Result<Schedule>> => {
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
        // メモがあれば設定
        if (input.userMemo) {
          supplement.userMemo = input.userMemo;
        }
        await supplementRepo.save(supplement);
      } else if (input.userMemo) {
        // AI検索なしでメモのみの場合
        const supplement = createSupplementForMemo(schedule.id, input.userMemo);
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
