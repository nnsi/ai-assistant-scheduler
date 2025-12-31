import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import { type Result, ok, err } from "../../../shared/result";
import { createNotFoundError } from "../../../shared/errors";

export const createDeleteScheduleUseCase = (repo: ScheduleRepo) => {
  return async (id: string): Promise<Result<void>> => {
    const existing = await repo.findById(id);
    if (!existing) {
      return err(createNotFoundError("スケジュール"));
    }

    await repo.delete(id);
    return ok(undefined);
  };
};

export type DeleteScheduleUseCase = ReturnType<typeof createDeleteScheduleUseCase>;
