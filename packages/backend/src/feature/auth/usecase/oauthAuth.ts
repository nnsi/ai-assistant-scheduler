import type { Result } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";
import type { UserRepo } from "../../../domain/infra/userRepo";
import type { RefreshTokenRepo } from "../../../domain/infra/refreshTokenRepo";
import type { OAuthProvider } from "../../../infra/auth/oauth";
import {
  type JwtService,
  REFRESH_TOKEN_EXPIRY_SECONDS,
} from "../../../infra/auth/jwt";
import {
  createUser,
  updateUserFromOAuth,
  type UserEntity,
} from "../../../domain/model/user";
import { createRefreshToken } from "../../../domain/model/refreshToken";
import type { AuthResponse } from "@ai-scheduler/shared";

export type OAuthAuthUseCase = (
  code: string,
  redirectUri: string
) => Promise<Result<AuthResponse, AppError>>;

export const createOAuthAuthUseCase =
  (
    userRepo: UserRepo,
    refreshTokenRepo: RefreshTokenRepo,
    oauthProvider: OAuthProvider,
    jwtService: JwtService
  ): OAuthAuthUseCase =>
  async (code, redirectUri) => {
    // 1. 認証コードからアクセストークンを取得
    const tokenResult = await oauthProvider.exchangeCodeForToken(
      code,
      redirectUri
    );
    if (!tokenResult.ok) {
      return tokenResult;
    }

    // 2. アクセストークンからユーザー情報を取得
    const userInfoResult = await oauthProvider.getUserInfo(tokenResult.value);
    if (!userInfoResult.ok) {
      return userInfoResult;
    }

    const oauthUser = userInfoResult.value;

    // 3. 既存ユーザーを検索（または新規作成）
    let user: UserEntity;
    const existingUser = await userRepo.findByProviderId(
      oauthProvider.type,
      oauthUser.id
    );

    if (existingUser) {
      // 既存ユーザー: OAuth情報で更新
      user = updateUserFromOAuth(existingUser, oauthUser);
      await userRepo.update(user);
    } else {
      // 新規ユーザー: 作成
      user = createUser(oauthUser, oauthProvider.type);
      await userRepo.save(user);
    }

    // 4. リフレッシュトークンをDBに保存
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_SECONDS * 1000
    );
    const refreshTokenEntity = createRefreshToken(user.id, expiresAt);
    await refreshTokenRepo.save(refreshTokenEntity);

    // 5. JWTトークンを生成（アクセストークン + リフレッシュトークン）
    const tokens = await jwtService.generateTokens(user, refreshTokenEntity.id);

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
