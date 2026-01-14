import type { Category } from "@ai-scheduler/shared";
import type { CategoryRepo } from "../../../domain/infra/categoryRepo";
import {
  type UpdateCategoryInput,
  toPublicCategory,
  updateCategory as updateCategoryEntity,
} from "../../../domain/model/category";
import { createDatabaseError, createNotFoundError } from "../../../shared/errors";
import { type Result, err, ok } from "../../../shared/result";

export const createUpdateCategoryUseCase = (categoryRepo: CategoryRepo) => {
  return async (
    id: string,
    userId: string,
    input: UpdateCategoryInput
  ): Promise<Result<Category>> => {
    try {
      const existing = await categoryRepo.findByIdAndUserId(id, userId);
      if (!existing) {
        return err(createNotFoundError("カテゴリ"));
      }

      const updated = updateCategoryEntity(existing, input);
      await categoryRepo.update(updated);
      return ok(toPublicCategory(updated));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type UpdateCategoryUseCase = ReturnType<typeof createUpdateCategoryUseCase>;
