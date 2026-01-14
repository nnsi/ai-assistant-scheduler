import type { TokenResponse } from "@ai-scheduler/shared";
import type { RefreshTokenRepo } from "../../../domain/infra/refreshTokenRepo";
import type { UserRepo } from "../../../domain/infra/userRepo";
import { createRefreshToken, isTokenValid } from "../../../domain/model/refreshToken";
import { type JwtService, REFRESH_TOKEN_EXPIRY_SECONDS } from "../../../infra/auth/jwt";
import type { AppError } from "../../../shared/errors";
import { createUnauthorizedError } from "../../../shared/errors";
import type { Result } from "../../../shared/result";

export type RefreshTokenUseCase = (
  refreshToken: string
) => Promise<Result<TokenResponse, AppError>>;

export const createRefreshTokenUseCase =
  (
    userRepo: UserRepo,
    refreshTokenRepo: RefreshTokenRepo,
    jwtService: JwtService
  ): RefreshTokenUseCase =>
  async (refreshToken) => {
    // 1. リフレッシュトークンを検証 (JWT署名検証)
    const payload = await jwtService.verifyRefreshToken(refreshToken);
    if (!payload || !payload.jti) {
      return {
        ok: false,
        error: createUnauthorizedError("無効なリフレッシュトークンです"),
      };
    }

    // 2. DBでトークンの有効性を確認
    const tokenEntity = await refreshTokenRepo.findById(payload.jti);
    if (!tokenEntity || !isTokenValid(tokenEntity)) {
      return {
        ok: false,
        error: createUnauthorizedError("リフレッシュトークンが失効しています"),
      };
    }

    // 3. ユーザーが存在するか確認
    const user = await userRepo.findById(payload.sub);
    if (!user) {
      return {
        ok: false,
        error: createUnauthorizedError("ユーザーが見つかりません"),
      };
    }

    // 4. 古いトークンを失効させる (ローテーション)
    await refreshTokenRepo.revoke(payload.jti);

    // 5. 新しいリフレッシュトークンをDBに保存
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_SECONDS * 1000);
    const newTokenEntity = createRefreshToken(user.id, expiresAt);
    await refreshTokenRepo.save(newTokenEntity);

    // 6. 新しいトークンペアを生成
    const tokens = await jwtService.generateTokens(user, newTokenEntity.id);

    return {
      ok: true,
      value: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  };
