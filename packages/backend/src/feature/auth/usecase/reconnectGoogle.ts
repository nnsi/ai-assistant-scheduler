import type { Result } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";
import type { UserRepo } from "../../../domain/infra/userRepo";
import type { GoogleAuthService } from "../../../infra/auth/google";
import { createConflictError, createNotFoundError } from "../../../shared/errors";
import type { User } from "@ai-scheduler/shared";

export type ReconnectGoogleUseCase = (
  userId: string,
  code: string,
  redirectUri: string
) => Promise<Result<User, AppError>>;

export const createReconnectGoogleUseCase =
  (
    userRepo: UserRepo,
    googleAuthService: GoogleAuthService
  ): ReconnectGoogleUseCase =>
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
    const tokenResult = await googleAuthService.exchangeCodeForToken(
      code,
      redirectUri
    );
    if (!tokenResult.ok) {
      return tokenResult;
    }

    // 3. アクセストークンからGoogleユーザー情報を取得
    const userInfoResult = await googleAuthService.getUserInfo(
      tokenResult.value
    );
    if (!userInfoResult.ok) {
      return userInfoResult;
    }

    const googleUser = userInfoResult.value;

    // 4. 新しいGoogleアカウントが既に別のユーザーに紐づいていないか確認
    const existingUser = await userRepo.findByGoogleId(googleUser.id);
    if (existingUser && existingUser.id !== userId) {
      return {
        ok: false,
        error: createConflictError("このGoogleアカウントは既に別のユーザーに紐づいています"),
      };
    }

    // 5. Google情報を更新
    const updatedUser = {
      ...user,
      googleId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture ?? user.picture,
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
