import type { CategoryEntity } from "../model/category";

// リポジトリ型定義
export type CategoryRepo = {
  findAllByUserId: (userId: string) => Promise<CategoryEntity[]>;
  findById: (id: string) => Promise<CategoryEntity | null>;
  findByIdAndUserId: (id: string, userId: string) => Promise<CategoryEntity | null>;
  save: (category: CategoryEntity) => Promise<void>;
  update: (category: CategoryEntity) => Promise<void>;
  delete: (id: string) => Promise<void>;
};
