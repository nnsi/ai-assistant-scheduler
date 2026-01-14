import type { RefreshTokenRepo } from "../../../domain/infra/refreshTokenRepo";
import type { JwtService } from "../../../infra/auth/jwt";
import type { AppError } from "../../../shared/errors";
import { createUnauthorizedError } from "../../../shared/errors";
import type { Result } from "../../../shared/result";

export type LogoutUseCase = (refreshToken: string) => Promise<Result<{ success: true }, AppError>>;

export const createLogoutUseCase =
  (refreshTokenRepo: RefreshTokenRepo, jwtService: JwtService): LogoutUseCase =>
  async (refreshToken) => {
    // 1. リフレッシュトークンを検証 (JWT署名検証)
    const payload = await jwtService.verifyRefreshToken(refreshToken);
    if (!payload || !payload.jti) {
      return {
        ok: false,
        error: createUnauthorizedError("無効なリフレッシュトークンです"),
      };
    }

    // 2. そのユーザーの全リフレッシュトークンを失効させる
    await refreshTokenRepo.revokeAllByUserId(payload.sub);

    return {
      ok: true,
      value: { success: true },
    };
  };
