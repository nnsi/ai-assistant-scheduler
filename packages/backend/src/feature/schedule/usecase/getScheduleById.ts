import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import type { SupplementRepo } from "../../../domain/infra/supplementRepo";
import { toPublicSchedule } from "../../../domain/model/schedule";
import type { Schedule } from "@ai-scheduler/shared";
import type { Supplement } from "../../../domain/model/supplement";
import { type Result, ok, err } from "../../../shared/result";
import { createNotFoundError, createDatabaseError } from "../../../shared/errors";

export type ScheduleWithSupplement = Schedule & {
  supplement: Supplement | null;
};

export const createGetScheduleByIdUseCase = (
  scheduleRepo: ScheduleRepo,
  supplementRepo: SupplementRepo
) => {
  return async (
    id: string,
    userId: string
  ): Promise<Result<ScheduleWithSupplement>> => {
    try {
      const schedule = await scheduleRepo.findByIdAndUserId(id, userId);
      if (!schedule) {
        return err(createNotFoundError("スケジュール"));
      }

      const supplement = await supplementRepo.findByScheduleId(id);

      return ok({
        ...toPublicSchedule(schedule),
        supplement,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type GetScheduleByIdUseCase = ReturnType<typeof createGetScheduleByIdUseCase>;
