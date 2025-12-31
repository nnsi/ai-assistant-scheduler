import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import type { SupplementRepo } from "../../../domain/infra/supplementRepo";
import type { Schedule } from "../../../domain/model/schedule";
import type { Supplement } from "../../../domain/model/supplement";
import { type Result, ok, err } from "../../../shared/result";
import { createNotFoundError } from "../../../shared/errors";

export type ScheduleWithSupplement = Schedule & {
  supplement: Supplement | null;
};

export const createGetScheduleByIdUseCase = (
  scheduleRepo: ScheduleRepo,
  supplementRepo: SupplementRepo
) => {
  return async (id: string): Promise<Result<ScheduleWithSupplement>> => {
    const schedule = await scheduleRepo.findById(id);
    if (!schedule) {
      return err(createNotFoundError("スケジュール"));
    }

    const supplement = await supplementRepo.findByScheduleId(id);

    return ok({
      ...schedule,
      supplement,
    });
  };
};

export type GetScheduleByIdUseCase = ReturnType<typeof createGetScheduleByIdUseCase>;
