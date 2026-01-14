import type { AppError } from "../../shared/errors";
import type { Result } from "../../shared/result";

// サポートするプロバイダの種類
export type OAuthProviderType = "google" | "github" | "microsoft";

// OAuthプロバイダから取得するユーザー情報
export type OAuthUserInfo = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

// OAuthプロバイダのインターフェース
export type OAuthProvider = {
  readonly type: OAuthProviderType;

  // 認証コードからアクセストークンを取得
  exchangeCodeForToken: (code: string, redirectUri: string) => Promise<Result<string, AppError>>;

  // アクセストークンからユーザー情報を取得
  getUserInfo: (accessToken: string) => Promise<Result<OAuthUserInfo, AppError>>;
};

// プロバイダ設定の型
export type OAuthProviderConfig = {
  clientId: string;
  clientSecret: string;
};
