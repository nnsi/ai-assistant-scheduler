import {
  type Schedule,
  type CreateScheduleInput,
  type UpdateScheduleInput,
} from "@ai-scheduler/shared";
import { generateId } from "../../shared/id";

// Re-export types from shared
export type { Schedule, CreateScheduleInput, UpdateScheduleInput };

// 内部エンティティ型（userIdを含む）
export type ScheduleEntity = Schedule & {
  userId: string;
};

// ファクトリ関数
export const createSchedule = (
  input: CreateScheduleInput,
  userId: string
): ScheduleEntity => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    userId,
    title: input.title,
    startAt: input.startAt,
    endAt: input.endAt ?? null,
    isAllDay: input.isAllDay ?? false,
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
    updatedAt: new Date().toISOString(),
  };
};
