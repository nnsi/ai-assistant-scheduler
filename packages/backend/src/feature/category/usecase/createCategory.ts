import type { CategoryRepo } from "../../../domain/infra/categoryRepo";
import {
  createCategory as createCategoryEntity,
  toPublicCategory,
  type CreateCategoryInput,
} from "../../../domain/model/category";
import type { Category } from "@ai-scheduler/shared";
import { type Result, ok, err } from "../../../shared/result";
import { createDatabaseError } from "../../../shared/errors";

export const createCreateCategoryUseCase = (categoryRepo: CategoryRepo) => {
  return async (
    input: CreateCategoryInput,
    userId: string
  ): Promise<Result<Category>> => {
    try {
      const category = createCategoryEntity(input, userId);
      await categoryRepo.save(category);
      return ok(toPublicCategory(category));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type CreateCategoryUseCase = ReturnType<typeof createCreateCategoryUseCase>;
