import { z } from "zod";

// プロファイルスキーマ（シンプルな自由テキスト形式）
export const userProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  requiredConditions: z.string(),
  preferredConditions: z.string(),
  subjectiveConditions: z.string(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// プロファイル更新リクエスト
export const updateProfileConditionsSchema = z.object({
  requiredConditions: z.string().optional(),
  preferredConditions: z.string().optional(),
  subjectiveConditions: z.string().optional(),
});

export type UpdateProfileConditionsRequest = z.infer<
  typeof updateProfileConditionsSchema
>;

// プロファイルレスポンス
export const profileResponseSchema = z.object({
  profile: userProfileSchema,
});
