import { z } from "zod";

// エラーコード
export const errorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "CONFLICT",
  "AI_ERROR",
  "DATABASE_ERROR",
  "INTERNAL_ERROR",
]);

export type ErrorCode = z.infer<typeof errorCodeSchema>;

// APIエラーレスポンス
export const apiErrorSchema = z.object({
  code: errorCodeSchema,
  message: z.string(),
  details: z.unknown().optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

// バリデーションエラー詳細
export const validationErrorDetailSchema = z.object({
  path: z.string(),
  message: z.string(),
});

export type ValidationErrorDetail = z.infer<typeof validationErrorDetailSchema>;
