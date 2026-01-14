import type { Category } from "@ai-scheduler/shared";
import type { CategoryRepo } from "../../../domain/infra/categoryRepo";
import {
  type CreateCategoryInput,
  createCategory as createCategoryEntity,
  toPublicCategory,
} from "../../../domain/model/category";
import { createDatabaseError } from "../../../shared/errors";
import { type Result, err, ok } from "../../../shared/result";

export const createCreateCategoryUseCase = (categoryRepo: CategoryRepo) => {
  return async (input: CreateCategoryInput, userId: string): Promise<Result<Category>> => {
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
