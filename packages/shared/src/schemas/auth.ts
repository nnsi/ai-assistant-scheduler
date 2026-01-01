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
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

// トークンリフレッシュリクエスト
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "リフレッシュトークンが必要です"),
});

export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;

// トークンリフレッシュレスポンス
export const tokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type TokenResponse = z.infer<typeof tokenResponseSchema>;

// 現在のユーザー情報レスポンス
export const meResponseSchema = z.object({
  user: userSchema,
});

export type MeResponse = z.infer<typeof meResponseSchema>;

// ログアウトリクエスト
export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "リフレッシュトークンが必要です"),
});

export type LogoutRequest = z.infer<typeof logoutSchema>;

// メールアドレス更新リクエスト
export const updateEmailSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
});

export type UpdateEmailRequest = z.infer<typeof updateEmailSchema>;

// Google認証再設定リクエスト
export const reconnectGoogleSchema = z.object({
  code: z.string().min(1, "認証コードが必要です"),
  redirectUri: z.string().url("有効なリダイレクトURIが必要です"),
});

export type ReconnectGoogleRequest = z.infer<typeof reconnectGoogleSchema>;

// プロファイル更新レスポンス
export const updateProfileResponseSchema = z.object({
  user: userSchema,
});

export type UpdateProfileResponse = z.infer<typeof updateProfileResponseSchema>;
