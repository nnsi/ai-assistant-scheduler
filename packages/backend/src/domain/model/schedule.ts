import {
  type Category,
  type CreateScheduleInput,
  type RecurrenceRule,
  type Schedule,
  type UpdateScheduleInput,
} from "@ai-scheduler/shared";
import { generateId } from "../../shared/id";

// Re-export types from shared
export type { Schedule, CreateScheduleInput, UpdateScheduleInput };

// 内部エンティティ型（userIdを含む）
export type ScheduleEntity = Omit<Schedule, "category" | "recurrence"> & {
  userId: string;
  calendarId: string | null;
  createdBy: string | null;
  categoryId: string | null;
  category?: Category | null;
  recurrence?: RecurrenceRule | null;
};

// ファクトリ関数
export const createSchedule = (
  input: CreateScheduleInput,
  userId: string,
  calendarId: string | null = null
): ScheduleEntity => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    userId,
    calendarId: input.calendarId ?? calendarId,
    createdBy: userId, // スケジュール作成者
    title: input.title,
    startAt: input.startAt,
    endAt: input.endAt ?? null,
    isAllDay: input.isAllDay ?? false,
    categoryId: input.categoryId ?? null,
    createdAt: now,
    updatedAt: now,
  };
};

// エンティティから公開用のスケジュールに変換
export const toPublicSchedule = (entity: ScheduleEntity): Schedule => ({
  id: entity.id,
  title: entity.title,
  startAt: entity.startAt,
  endAt: entity.endAt,
  isAllDay: entity.isAllDay,
  calendarId: entity.calendarId,
  categoryId: entity.categoryId,
  category: entity.category ?? null,
  recurrence: entity.recurrence ?? null,
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt,
});

// 更新関数
export const updateSchedule = (
  schedule: ScheduleEntity,
  input: UpdateScheduleInput
): ScheduleEntity => {
  return {
    ...schedule,
    title: input.title ?? schedule.title,
    startAt: input.startAt ?? schedule.startAt,
    endAt: input.endAt !== undefined ? input.endAt : schedule.endAt,
    isAllDay: input.isAllDay ?? schedule.isAllDay,
    categoryId: input.categoryId !== undefined ? input.categoryId : schedule.categoryId,
    updatedAt: new Date().toISOString(),
  };
};
