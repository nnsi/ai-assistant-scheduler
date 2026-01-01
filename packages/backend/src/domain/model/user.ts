import type { User } from "@ai-scheduler/shared";
import { generateId } from "../../shared/id";

// Re-export types from shared
export type { User };

// Google OAuthから取得するユーザー情報
export type GoogleUserInfo = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

// データベースに保存するユーザー情報
export type UserEntity = User & {
  googleId: string;
  createdAt: string;
  updatedAt: string;
};

// ファクトリ関数
export const createUser = (googleUser: GoogleUserInfo): UserEntity => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    email: googleUser.email,
    name: googleUser.name,
    picture: googleUser.picture ?? null,
    googleId: googleUser.id,
    createdAt: now,
    updatedAt: now,
  };
};

// GoogleユーザーInfoから既存ユーザーを更新
export const updateUserFromGoogle = (
  existingUser: UserEntity,
  googleUser: GoogleUserInfo
): UserEntity => {
  return {
    ...existingUser,
    name: googleUser.name,
    picture: googleUser.picture ?? existingUser.picture,
    updatedAt: new Date().toISOString(),
  };
};
