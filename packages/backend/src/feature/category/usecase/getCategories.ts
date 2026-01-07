import type { CategoryRepo } from "../../../domain/infra/categoryRepo";
import type { Category } from "@ai-scheduler/shared";
import { toPublicCategory } from "../../../domain/model/category";
import { type Result, ok } from "../../../shared/result";

export const createGetCategoriesUseCase = (repo: CategoryRepo) => {
  return async (userId: string): Promise<Result<Category[]>> => {
    const categories = await repo.findAllByUserId(userId);
    return ok(categories.map(toPublicCategory));
  };
};

export type GetCategoriesUseCase = ReturnType<typeof createGetCategoriesUseCase>;
