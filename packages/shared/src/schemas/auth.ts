import { z } from "zod";

// ユーザー情報
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  picture: z.string().nullable(),
});

export type User = z.infer<typeof userSchema>;

// Google OAuth認証コールバックのリクエスト
export const googleAuthCallbackSchema = z.object({
  code: z.string().min(1, "認証コードが必要です"),
  redirectUri: z.string().url("有効なリダイレクトURIが必要です"),
});

export type GoogleAuthCallback = z.infer<typeof googleAuthCallbackSchema>;

// 認証レスポンス
export const authResponseSchema = z.object({
  user: userSchema,
  token: z.string(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

// 現在のユーザー情報レスポンス
export const meResponseSchema = z.object({
  user: userSchema,
});

export type MeResponse = z.infer<typeof meResponseSchema>;
