import type { Result } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";
import type { UserRepo } from "../../../domain/infra/userRepo";
import { createConflictError, createNotFoundError } from "../../../shared/errors";
import type { User } from "@ai-scheduler/shared";

export type UpdateEmailUseCase = (
  userId: string,
  newEmail: string
) => Promise<Result<User, AppError>>;

export const createUpdateEmailUseCase =
  (userRepo: UserRepo): UpdateEmailUseCase =>
  async (userId, newEmail) => {
    // 1. 現在のユーザーを取得
    const user = await userRepo.findById(userId);
    if (!user) {
      return {
        ok: false,
        error: createNotFoundError("ユーザー"),
      };
    }

    // 2. 新しいメールアドレスが既に使われていないか確認
    const existingUser = await userRepo.findByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      return {
        ok: false,
        error: createConflictError("このメールアドレスは既に使用されています"),
      };
    }

    // 3. メールアドレスを更新
    const updatedUser = {
      ...user,
      email: newEmail,
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
