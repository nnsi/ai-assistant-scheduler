import type { Result } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";
import type { ProfileRepo } from "../../../domain/infra/profileRepo";
import type { ProfileEntity } from "../../../domain/model/profile";
import { createProfile, updateProfile } from "../../../domain/model/profile";
import type { UpdateProfileConditionsRequest } from "@ai-scheduler/shared";

export type UpdateProfileConditionsUseCase = (
  userId: string,
  updates: UpdateProfileConditionsRequest
) => Promise<Result<ProfileEntity, AppError>>;

export const createUpdateProfileConditionsUseCase =
  (profileRepo: ProfileRepo): UpdateProfileConditionsUseCase =>
  async (userId, updates) => {
    let profile = await profileRepo.findByUserId(userId);

    // プロファイルが存在しない場合は新規作成
    if (!profile) {
      profile = createProfile(userId);
      await profileRepo.save(profile);
    }

    const updatedProfile = updateProfile(profile, updates);
    await profileRepo.update(updatedProfile);

    return { ok: true, value: updatedProfile };
  };
