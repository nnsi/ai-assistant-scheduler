import {
  type Supplement,
  type SaveSupplementInput,
  type UpdateMemoInput,
  type SelectShopInput,
  type Shop,
} from "@ai-scheduler/shared";
import { generateId } from "../../shared/id";

// Re-export types from shared
export type { Supplement, SaveSupplementInput, UpdateMemoInput, SelectShopInput };

// ファクトリ関数
export const createSupplement = (
  input: SaveSupplementInput & { aiResult: string }
): Supplement => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    scheduleId: input.scheduleId,
    keywords: input.keywords,
    agentTypes: input.agentTypes ?? null,
    aiResult: input.aiResult,
    shopCandidates: input.shopCandidates ?? null,
    selectedShop: null,
    userMemo: null,
    createdAt: now,
    updatedAt: now,
  };
};

// お店選択関数
export const selectShop = (
  supplement: Supplement,
  shop: Shop
): Supplement => {
  return {
    ...supplement,
    selectedShop: shop,
    updatedAt: new Date().toISOString(),
  };
};

// メモ専用のsupplement作成関数（AI検索なしの予定用）
export const createSupplementForMemo = (
  scheduleId: string,
  userMemo: string
): Supplement => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    scheduleId,
    keywords: [],
    agentTypes: null,
    aiResult: null,
    shopCandidates: null,
    selectedShop: null,
    userMemo,
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
