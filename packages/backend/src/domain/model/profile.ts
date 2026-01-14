import type { UpdateProfileConditionsRequest, UserProfile } from "@ai-scheduler/shared";
import { generateId } from "../../shared/id";

// Re-export types from shared
export type { UserProfile };

// データベースに保存するプロファイル情報
export type ProfileEntity = UserProfile & {
  createdAt: string;
  updatedAt: string;
};

// ファクトリ関数: 新規プロファイル作成
export const createProfile = (userId: string): ProfileEntity => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    userId,
    requiredConditions: "",
    preferredConditions: "",
    subjectiveConditions: "",
    createdAt: now,
    updatedAt: now,
  };
};

// プロファイル更新
export const updateProfile = (
  existingProfile: ProfileEntity,
  updates: UpdateProfileConditionsRequest
): ProfileEntity => {
  return {
    ...existingProfile,
    requiredConditions: updates.requiredConditions ?? existingProfile.requiredConditions,
    preferredConditions: updates.preferredConditions ?? existingProfile.preferredConditions,
    subjectiveConditions: updates.subjectiveConditions ?? existingProfile.subjectiveConditions,
    updatedAt: new Date().toISOString(),
  };
};
