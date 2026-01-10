import { z } from "zod";
import { shopListSchema } from "./shop";
import { agentTypeSchema } from "./ai";

// 補足情報保存入力
export const saveSupplementInputSchema = z.object({
  scheduleId: z.string().min(1, "スケジュールIDは必須です"),
  keywords: z.array(z.string()).min(1, "キーワードを1つ以上選択してください"),
  agentTypes: z.array(agentTypeSchema).optional(),
  aiResult: z.string(),
  shopCandidates: shopListSchema.optional(),
});

export type SaveSupplementInput = z.infer<typeof saveSupplementInputSchema>;

// メモ更新入力
export const updateMemoInputSchema = z.object({
  userMemo: z.string().max(10000, "メモは10000文字以内です"),
});

export type UpdateMemoInput = z.infer<typeof updateMemoInputSchema>;

// お店選択入力（複数選択対応）
export const selectShopsInputSchema = z.object({
  shops: shopListSchema,
});

export type SelectShopsInput = z.infer<typeof selectShopsInputSchema>;

// 補足情報エンティティ
export const supplementSchema = z.object({
  id: z.string(),
  scheduleId: z.string(),
  keywords: z.array(z.string()),
  agentTypes: z.array(agentTypeSchema).nullable(),
  aiResult: z.string().nullable(),
  shopCandidates: shopListSchema.nullable(),
  selectedShops: shopListSchema.nullable(),
  userMemo: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Supplement = z.infer<typeof supplementSchema>;
