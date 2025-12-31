import { z } from "zod";

// キーワード提案入力
export const suggestKeywordsInputSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  startAt: z.string().datetime({ offset: true, message: "有効な日時形式で入力してください" }),
});

export type SuggestKeywordsInput = z.infer<typeof suggestKeywordsInputSchema>;

// キーワード提案レスポンス
export const suggestKeywordsResponseSchema = z.object({
  keywords: z.array(z.string()),
});

export type SuggestKeywordsResponse = z.infer<typeof suggestKeywordsResponseSchema>;

// 検索入力
export const searchInputSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  startAt: z.string().datetime({ offset: true }),
  keywords: z.array(z.string()).min(1, "キーワードを1つ以上選択してください"),
});

export type SearchInput = z.infer<typeof searchInputSchema>;

// 検索レスポンス
export const searchResponseSchema = z.object({
  result: z.string(),
});

export type SearchResponse = z.infer<typeof searchResponseSchema>;
