import {
  type Schedule,
  type CreateScheduleInput,
  type UpdateScheduleInput,
} from "@ai-scheduler/shared";
import { generateId } from "../../shared/id";

// Re-export types from shared
export type { Schedule, CreateScheduleInput, UpdateScheduleInput };

// ファクトリ関数
export const createSchedule = (input: CreateScheduleInput): Schedule => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: input.title,
    startAt: input.startAt,
    endAt: input.endAt ?? null,
    createdAt: now,
    updatedAt: now,
  };
};

// 更新関数
export const updateSchedule = (
  schedule: Schedule,
  input: UpdateScheduleInput
): Schedule => {
  return {
    ...schedule,
    title: input.title ?? schedule.title,
    startAt: input.startAt ?? schedule.startAt,
    endAt: input.endAt !== undefined ? input.endAt : schedule.endAt,
    updatedAt: new Date().toISOString(),
  };
};
