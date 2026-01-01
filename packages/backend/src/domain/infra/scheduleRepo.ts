import type { ScheduleEntity } from "../model/schedule";

// リポジトリ型定義
export type ScheduleRepo = {
  findAllByUserId: (userId: string) => Promise<ScheduleEntity[]>;
  findByMonthAndUserId: (
    year: number,
    month: number,
    userId: string
  ) => Promise<ScheduleEntity[]>;
  findById: (id: string) => Promise<ScheduleEntity | null>;
  findByIdAndUserId: (id: string, userId: string) => Promise<ScheduleEntity | null>;
  save: (schedule: ScheduleEntity) => Promise<void>;
  update: (schedule: ScheduleEntity) => Promise<void>;
  delete: (id: string) => Promise<void>;
};
