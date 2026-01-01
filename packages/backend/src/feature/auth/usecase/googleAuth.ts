import type { Result } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";
import type { UserRepo } from "../../../domain/infra/userRepo";
import type { GoogleAuthService } from "../../../infra/auth/google";
import type { JwtService } from "../../../infra/auth/jwt";
import {
  createUser,
  updateUserFromGoogle,
  type UserEntity,
} from "../../../domain/model/user";
import type { AuthResponse } from "@ai-scheduler/shared";

export type GoogleAuthUseCase = (
  code: string,
  redirectUri: string
) => Promise<Result<AuthResponse, AppError>>;

export const createGoogleAuthUseCase =
  (
    userRepo: UserRepo,
    googleAuthService: GoogleAuthService,
    jwtService: JwtService
  ): GoogleAuthUseCase =>
  async (code, redirectUri) => {
    // 1. 認証コードからアクセストークンを取得
    const tokenResult = await googleAuthService.exchangeCodeForToken(
      code,
      redirectUri
    );
    if (!tokenResult.ok) {
      return tokenResult;
    }

    // 2. アクセストークンからGoogleユーザー情報を取得
    const userInfoResult = await googleAuthService.getUserInfo(
      tokenResult.value
    );
    if (!userInfoResult.ok) {
      return userInfoResult;
    }

    const googleUser = userInfoResult.value;

    // 3. 既存ユーザーを検索（または新規作成）
    let user: UserEntity;
    const existingUser = await userRepo.findByGoogleId(googleUser.id);

    if (existingUser) {
      // 既存ユーザー: Google情報で更新
      user = updateUserFromGoogle(existingUser, googleUser);
      await userRepo.update(user);
    } else {
      // 新規ユーザー: 作成
      user = createUser(googleUser);
      await userRepo.save(user);
    }

    // 4. JWTトークンを生成（アクセストークン + リフレッシュトークン）
    const tokens = await jwtService.generateTokens(user);

    return {
      ok: true,
      value: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  };
