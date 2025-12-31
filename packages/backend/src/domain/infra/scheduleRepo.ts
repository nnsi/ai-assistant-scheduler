import type { Schedule } from "../model/schedule";

// リポジトリ型定義
export type ScheduleRepo = {
  findAll: () => Promise<Schedule[]>;
  findByMonth: (year: number, month: number) => Promise<Schedule[]>;
  findById: (id: string) => Promise<Schedule | null>;
  save: (schedule: Schedule) => Promise<void>;
  update: (schedule: Schedule) => Promise<void>;
  delete: (id: string) => Promise<void>;
};
