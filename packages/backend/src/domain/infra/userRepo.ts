import type { UserEntity } from "../model/user";
import type { OAuthProviderType } from "../../infra/auth/oauth";

// ユーザーリポジトリ型定義
export type UserRepo = {
  findById: (id: string) => Promise<UserEntity | null>;
  findByProviderId: (provider: OAuthProviderType, providerId: string) => Promise<UserEntity | null>;
  findByEmail: (email: string) => Promise<UserEntity | null>;
  save: (user: UserEntity) => Promise<void>;
  update: (user: UserEntity) => Promise<void>;
};
