import type { ZodError } from "zod";
import type { ErrorCode, ApiError } from "@ai-scheduler/shared";

// Re-export types from shared
export type { ErrorCode, ApiError };

// アプリケーションエラー型
export type AppError = ApiError;

// エラーファクトリ
export const createValidationError = (error: ZodError): AppError => ({
  code: "VALIDATION_ERROR",
  message: "入力値が不正です",
  details: error.errors.map((e) => ({
    path: e.path.join("."),
    message: e.message,
  })),
});

export const createNotFoundError = (resource: string): AppError => ({
  code: "NOT_FOUND",
  message: `${resource}が見つかりません`,
});

export const createAiError = (message: string): AppError => ({
  code: "AI_ERROR",
  message: `AI処理エラー: ${message}`,
});

export const createDatabaseError = (message: string): AppError => ({
  code: "DATABASE_ERROR",
  message: `データベースエラー: ${message}`,
});

export const createInternalError = (message: string): AppError => ({
  code: "INTERNAL_ERROR",
  message: `内部エラー: ${message}`,
});

export const createUnauthorizedError = (message?: string): AppError => ({
  code: "UNAUTHORIZED",
  message: message || "認証が必要です",
});

export const createConflictError = (message: string): AppError => ({
  code: "CONFLICT",
  message,
});
