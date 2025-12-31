import type { Supplement } from "../model/supplement";

// リポジトリ型定義
export type SupplementRepo = {
  findByScheduleId: (scheduleId: string) => Promise<Supplement | null>;
  save: (supplement: Supplement) => Promise<void>;
  update: (supplement: Supplement) => Promise<void>;
  delete: (scheduleId: string) => Promise<void>;
};
