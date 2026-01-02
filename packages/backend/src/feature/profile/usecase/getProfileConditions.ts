import type { Result } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";
import type { ProfileRepo } from "../../../domain/infra/profileRepo";
import type { ProfileEntity } from "../../../domain/model/profile";
import { createProfile } from "../../../domain/model/profile";

export type GetProfileConditionsUseCase = (
  userId: string
) => Promise<Result<ProfileEntity, AppError>>;

export const createGetProfileConditionsUseCase =
  (profileRepo: ProfileRepo): GetProfileConditionsUseCase =>
  async (userId) => {
    let profile = await profileRepo.findByUserId(userId);

    // プロファイルが存在しない場合は新規作成
    if (!profile) {
      profile = createProfile(userId);
      await profileRepo.save(profile);
    }

    return { ok: true, value: profile };
  };
