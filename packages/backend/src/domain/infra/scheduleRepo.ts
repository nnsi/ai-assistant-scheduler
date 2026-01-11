import type { ScheduleEntity } from "../model/schedule";

// 検索オプション
export type SearchOptions = {
  query?: string;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
};

// リポジトリ型定義
export type ScheduleRepo = {
  findAllByUserId: (userId: string) => Promise<ScheduleEntity[]>;
  findByMonthAndUserId: (
    year: number,
    month: number,
    userId: string
  ) => Promise<ScheduleEntity[]>;
  findByCalendarIdsOrUserId: (calendarIds: string[], userId: string) => Promise<ScheduleEntity[]>;
  findByMonthAndCalendarIdsOrUserId: (
    year: number,
    month: number,
    calendarIds: string[],
    userId: string
  ) => Promise<ScheduleEntity[]>;
  findById: (id: string) => Promise<ScheduleEntity | null>;
  findByIdAndUserId: (id: string, userId: string) => Promise<ScheduleEntity | null>;
  search: (userId: string, options: SearchOptions) => Promise<ScheduleEntity[]>;
  save: (schedule: ScheduleEntity) => Promise<void>;
  update: (schedule: ScheduleEntity) => Promise<void>;
  delete: (id: string) => Promise<void>;
};
