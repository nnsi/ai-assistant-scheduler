import type { SupplementRepo } from "../../../domain/infra/supplementRepo";
import {
  updateSupplementMemo,
  type Supplement,
  type UpdateMemoInput,
} from "../../../domain/model/supplement";
import { type Result, ok, err } from "../../../shared/result";
import { createNotFoundError } from "../../../shared/errors";

export const createUpdateMemoUseCase = (supplementRepo: SupplementRepo) => {
  return async (
    scheduleId: string,
    input: UpdateMemoInput
  ): Promise<Result<Supplement>> => {
    const existing = await supplementRepo.findByScheduleId(scheduleId);
    if (!existing) {
      return err(createNotFoundError("補足情報"));
    }

    const updated = updateSupplementMemo(existing, input);
    await supplementRepo.update(updated);
    return ok(updated);
  };
};

export type UpdateMemoUseCase = ReturnType<typeof createUpdateMemoUseCase>;
