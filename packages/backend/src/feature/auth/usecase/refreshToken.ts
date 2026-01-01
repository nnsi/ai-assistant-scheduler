import type { Result } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";
import type { UserRepo } from "../../../domain/infra/userRepo";
import type { JwtService } from "../../../infra/auth/jwt";
import { createUnauthorizedError } from "../../../shared/errors";
import type { TokenResponse } from "@ai-scheduler/shared";

export type RefreshTokenUseCase = (
  refreshToken: string
) => Promise<Result<TokenResponse, AppError>>;

export const createRefreshTokenUseCase =
  (userRepo: UserRepo, jwtService: JwtService): RefreshTokenUseCase =>
  async (refreshToken) => {
    // 1. リフレッシュトークンを検証
    const payload = await jwtService.verifyRefreshToken(refreshToken);
    if (!payload) {
      return {
        ok: false,
        error: createUnauthorizedError("無効なリフレッシュトークンです"),
      };
    }

    // 2. ユーザーが存在するか確認
    const user = await userRepo.findById(payload.sub);
    if (!user) {
      return {
        ok: false,
        error: createUnauthorizedError("ユーザーが見つかりません"),
      };
    }

    // 3. 新しいトークンペアを生成
    const tokens = await jwtService.generateTokens(user);

    return {
      ok: true,
      value: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  };
