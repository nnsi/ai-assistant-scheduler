import type { RecurrenceRuleEntity } from "../model/recurrence";

// リポジトリ型定義
export type RecurrenceRepo = {
  findByScheduleId: (scheduleId: string) => Promise<RecurrenceRuleEntity | null>;
  findByScheduleIds: (scheduleIds: string[]) => Promise<RecurrenceRuleEntity[]>;
  save: (rule: RecurrenceRuleEntity) => Promise<void>;
  update: (rule: RecurrenceRuleEntity) => Promise<void>;
  delete: (id: string) => Promise<void>;
  deleteByScheduleId: (scheduleId: string) => Promise<void>;
};
