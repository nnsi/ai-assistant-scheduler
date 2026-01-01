import type { Result } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";
import { createNotFoundError } from "../../../shared/errors";
import type { UserRepo } from "../../../domain/infra/userRepo";
import type { User } from "@ai-scheduler/shared";

export type GetCurrentUserUseCase = (userId: string) => Promise<Result<User, AppError>>;

export const createGetCurrentUserUseCase =
  (userRepo: UserRepo): GetCurrentUserUseCase =>
  async (userId) => {
    const user = await userRepo.findById(userId);

    if (!user) {
      return {
        ok: false,
        error: createNotFoundError("ユーザー"),
      };
    }

    return {
      ok: true,
      value: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    };
  };
