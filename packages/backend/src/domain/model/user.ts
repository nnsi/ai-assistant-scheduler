import type { User } from "@ai-scheduler/shared";
import type { OAuthProviderType, OAuthUserInfo } from "../../infra/auth/oauth";
import { generateId } from "../../shared/id";

// Re-export types from shared
export type { User };

// データベースに保存するユーザー情報
export type UserEntity = User & {
  provider: OAuthProviderType;
  providerId: string;
  createdAt: string;
  updatedAt: string;
};

// ファクトリ関数
export const createUser = (oauthUser: OAuthUserInfo, provider: OAuthProviderType): UserEntity => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    email: oauthUser.email,
    name: oauthUser.name,
    picture: oauthUser.picture ?? null,
    provider,
    providerId: oauthUser.id,
    createdAt: now,
    updatedAt: now,
  };
};

// OAuthユーザー情報から既存ユーザーを更新
export const updateUserFromOAuth = (
  existingUser: UserEntity,
  oauthUser: OAuthUserInfo
): UserEntity => {
  return {
    ...existingUser,
    name: oauthUser.name,
    picture: oauthUser.picture ?? existingUser.picture,
    updatedAt: new Date().toISOString(),
  };
};
