import type { SupplementRepo } from "../../../domain/infra/supplementRepo";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import {
  updateSupplementMemo,
  type Supplement,
  type UpdateMemoInput,
} from "../../../domain/model/supplement";
import { type Result, ok, err } from "../../../shared/result";
import {
  createNotFoundError,
  createDatabaseError,
  createForbiddenError,
} from "../../../shared/errors";

export const createUpdateMemoUseCase = (
  supplementRepo: SupplementRepo,
  scheduleRepo: ScheduleRepo
) => {
  return async (
    scheduleId: string,
    input: UpdateMemoInput,
    userId: string
  ): Promise<Result<Supplement>> => {
    try {
      // スケジュールの所有権を確認
      const schedule = await scheduleRepo.findByIdAndUserId(scheduleId, userId);
      if (!schedule) {
        return err(createForbiddenError("このスケジュールへのアクセス権がありません"));
      }

      const existing = await supplementRepo.findByScheduleId(scheduleId);
      if (!existing) {
        return err(createNotFoundError("補足情報"));
      }

      const updated = updateSupplementMemo(existing, input);
      await supplementRepo.update(updated);
      return ok(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type UpdateMemoUseCase = ReturnType<typeof createUpdateMemoUseCase>;
