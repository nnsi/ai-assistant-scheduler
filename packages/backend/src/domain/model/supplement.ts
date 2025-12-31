import {
  type Supplement,
  type SaveSupplementInput,
  type UpdateMemoInput,
} from "@ai-scheduler/shared";
import { generateId } from "../../shared/id";

// Re-export types from shared
export type { Supplement, SaveSupplementInput, UpdateMemoInput };

// ファクトリ関数
export const createSupplement = (
  input: SaveSupplementInput & { aiResult: string }
): Supplement => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    scheduleId: input.scheduleId,
    keywords: input.keywords,
    aiResult: input.aiResult,
    userMemo: null,
    createdAt: now,
    updatedAt: now,
  };
};

// メモ更新関数
export const updateSupplementMemo = (
  supplement: Supplement,
  input: UpdateMemoInput
): Supplement => {
  return {
    ...supplement,
    userMemo: input.userMemo,
    updatedAt: new Date().toISOString(),
  };
};
