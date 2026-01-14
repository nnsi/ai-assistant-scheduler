import type { User } from "@ai-scheduler/shared";
import type { UserRepo } from "../../../domain/infra/userRepo";
import type { OAuthProvider } from "../../../infra/auth/oauth";
import type { AppError } from "../../../shared/errors";
import { createConflictError, createNotFoundError } from "../../../shared/errors";
import type { Result } from "../../../shared/result";

export type ReconnectOAuthUseCase = (
  userId: string,
  code: string,
  redirectUri: string
) => Promise<Result<User, AppError>>;

export const createReconnectOAuthUseCase =
  (userRepo: UserRepo, oauthProvider: OAuthProvider): ReconnectOAuthUseCase =>
  async (userId, code, redirectUri) => {
    // 1. 現在のユーザーを取得
    const user = await userRepo.findById(userId);
    if (!user) {
      return {
        ok: false,
        error: createNotFoundError("ユーザー"),
      };
    }

    // 2. 認証コードからアクセストークンを取得
    const tokenResult = await oauthProvider.exchangeCodeForToken(code, redirectUri);
    if (!tokenResult.ok) {
      return tokenResult;
    }

    // 3. アクセストークンからユーザー情報を取得
    const userInfoResult = await oauthProvider.getUserInfo(tokenResult.value);
    if (!userInfoResult.ok) {
      return userInfoResult;
    }

    const oauthUser = userInfoResult.value;

    // 4. 新しいアカウントが既に別のユーザーに紐づいていないか確認
    const existingUser = await userRepo.findByProviderId(oauthProvider.type, oauthUser.id);
    if (existingUser && existingUser.id !== userId) {
      return {
        ok: false,
        error: createConflictError("このアカウントは既に別のユーザーに紐づいています"),
      };
    }

    // 5. OAuth情報を更新
    const updatedUser = {
      ...user,
      provider: oauthProvider.type,
      providerId: oauthUser.id,
      email: oauthUser.email,
      name: oauthUser.name,
      picture: oauthUser.picture ?? user.picture,
      updatedAt: new Date().toISOString(),
    };
    await userRepo.update(updatedUser);

    return {
      ok: true,
      value: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        picture: updatedUser.picture,
      },
    };
  };
