import {
  type Category,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@ai-scheduler/shared";
import { generateId } from "../../shared/id";

// Re-export types from shared
export type { Category, CreateCategoryInput, UpdateCategoryInput };

// 内部エンティティ型（userIdを含む）
export type CategoryEntity = Category & {
  userId: string;
};

// ファクトリ関数
export const createCategory = (
  input: CreateCategoryInput,
  userId: string
): CategoryEntity => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    userId,
    name: input.name,
    color: input.color,
    createdAt: now,
    updatedAt: now,
  };
};

// エンティティから公開用のカテゴリに変換
export const toPublicCategory = (entity: CategoryEntity): Category => ({
  id: entity.id,
  name: entity.name,
  color: entity.color,
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt,
});

// 更新関数
export const updateCategory = (
  category: CategoryEntity,
  input: UpdateCategoryInput
): CategoryEntity => {
  return {
    ...category,
    name: input.name ?? category.name,
    color: input.color ?? category.color,
    updatedAt: new Date().toISOString(),
  };
};
