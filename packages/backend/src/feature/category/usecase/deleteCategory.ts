import type { CategoryRepo } from "../../../domain/infra/categoryRepo";
import { createDatabaseError, createNotFoundError } from "../../../shared/errors";
import { type Result, err, ok } from "../../../shared/result";

export const createDeleteCategoryUseCase = (categoryRepo: CategoryRepo) => {
  return async (id: string, userId: string): Promise<Result<void>> => {
    try {
      const existing = await categoryRepo.findByIdAndUserId(id, userId);
      if (!existing) {
        return err(createNotFoundError("カテゴリ"));
      }

      await categoryRepo.delete(id);
      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type DeleteCategoryUseCase = ReturnType<typeof createDeleteCategoryUseCase>;
