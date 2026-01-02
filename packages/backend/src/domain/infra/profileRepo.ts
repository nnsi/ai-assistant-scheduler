import type { ProfileEntity } from "../model/profile";

// プロファイルリポジトリ型定義
export type ProfileRepo = {
  findByUserId: (userId: string) => Promise<ProfileEntity | null>;
  save: (profile: ProfileEntity) => Promise<void>;
  update: (profile: ProfileEntity) => Promise<void>;
};
