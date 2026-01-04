import { z } from "zod";
import { shopSchema, shopListSchema } from "./shop";

// 補足情報保存入力
export const saveSupplementInputSchema = z.object({
  scheduleId: z.string().min(1, "スケジュールIDは必須です"),
  keywords: z.array(z.string()).min(1, "キーワードを1つ以上選択してください"),
  aiResult: z.string(),
  shopCandidates: shopListSchema.optional(),
});

export type SaveSupplementInput = z.infer<typeof saveSupplementInputSchema>;

// メモ更新入力
export const updateMemoInputSchema = z.object({
  userMemo: z.string().max(10000, "メモは10000文字以内です"),
});

export type UpdateMemoInput = z.infer<typeof updateMemoInputSchema>;

// お店選択入力
export const selectShopInputSchema = z.object({
  shop: shopSchema,
});

export type SelectShopInput = z.infer<typeof selectShopInputSchema>;

// 補足情報エンティティ
export const supplementSchema = z.object({
  id: z.string(),
  scheduleId: z.string(),
  keywords: z.array(z.string()),
  aiResult: z.string().nullable(),
  shopCandidates: shopListSchema.nullable(),
  selectedShop: shopSchema.nullable(),
  userMemo: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Supplement = z.infer<typeof supplementSchema>;
