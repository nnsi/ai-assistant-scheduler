import type { CategoryRepo } from "../../../domain/infra/categoryRepo";
import {
  updateCategory as updateCategoryEntity,
  toPublicCategory,
  type UpdateCategoryInput,
} from "../../../domain/model/category";
import type { Category } from "@ai-scheduler/shared";
import { type Result, ok, err } from "../../../shared/result";
import { createNotFoundError, createDatabaseError } from "../../../shared/errors";

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
