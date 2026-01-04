import { z } from "zod";

// エージェントタイプ
export const agentTypeSchema = z.enum(["search", "plan", "area-info"]);
export type AgentType = z.infer<typeof agentTypeSchema>;

// キーワード提案入力
export const suggestKeywordsInputSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  startAt: z.string().datetime({ offset: true, message: "有効な日時形式で入力してください" }),
  excludeKeywords: z.array(z.string()).optional(), // 再生成時に除外するキーワード
});

export type SuggestKeywordsInput = z.infer<typeof suggestKeywordsInputSchema>;

// キーワード提案レスポンス
export const suggestKeywordsResponseSchema = z.object({
  keywords: z.array(z.string()),
  agentTypes: z.array(agentTypeSchema),
});

export type SuggestKeywordsResponse = z.infer<typeof suggestKeywordsResponseSchema>;

// 検索入力
export const searchInputSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  startAt: z.string().datetime({ offset: true }),
  keywords: z.array(z.string()), // こだわり条件があれば0件でもOK
  agentTypes: z.array(agentTypeSchema).optional(), // 省略時は ["search"]
});

export type SearchInput = z.infer<typeof searchInputSchema>;

// 検索レスポンス
export const searchResponseSchema = z.object({
  result: z.string(),
});

export type SearchResponse = z.infer<typeof searchResponseSchema>;
