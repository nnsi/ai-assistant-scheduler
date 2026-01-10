import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import type { SupplementRepo } from "../../../domain/infra/supplementRepo";
import { toPublicSchedule } from "../../../domain/model/schedule";
import type { Schedule } from "@ai-scheduler/shared";
import type { Supplement } from "../../../domain/model/supplement";
import { type Result, ok, err } from "../../../shared/result";
import { createNotFoundError, createDatabaseError } from "../../../shared/errors";

export type ScheduleWithSupplement = Schedule & {
  supplement: Supplement | null;
};

// 繰り返し予定インスタンスIDのパターン: parentId_YYYY-MM-DD
const OCCURRENCE_ID_PATTERN = /^(.+)_(\d{4}-\d{2}-\d{2})$/;

// インスタンスIDから親IDと日付を抽出
const parseOccurrenceId = (id: string): { parentId: string; date: string } | null => {
  const match = id.match(OCCURRENCE_ID_PATTERN);
  if (!match) return null;
  return { parentId: match[1], date: match[2] };
};

export const createGetScheduleByIdUseCase = (
  scheduleRepo: ScheduleRepo,
  supplementRepo: SupplementRepo
) => {
  return async (
    id: string,
    userId: string
  ): Promise<Result<ScheduleWithSupplement>> => {
    try {
      // まず通常のIDとして検索
      let schedule = await scheduleRepo.findByIdAndUserId(id, userId);
      let scheduleId = id;
      let occurrenceDate: string | null = null;

      // 見つからない場合、繰り返し予定のインスタンスIDかチェック
      if (!schedule) {
        const parsed = parseOccurrenceId(id);
        if (parsed) {
          schedule = await scheduleRepo.findByIdAndUserId(parsed.parentId, userId);
          if (schedule) {
            scheduleId = parsed.parentId;
            occurrenceDate = parsed.date;
          }
        }
      }

      if (!schedule) {
        return err(createNotFoundError("スケジュール"));
      }

      // 親スケジュールのsupplementを取得
      const supplement = await supplementRepo.findByScheduleId(scheduleId);

      const publicSchedule = toPublicSchedule(schedule);

      // インスタンスの場合、日付を調整
      if (occurrenceDate) {
        const originalDate = new Date(publicSchedule.startAt);
        const [year, month, day] = occurrenceDate.split("-").map(Number);
        const newStartAt = new Date(year, month - 1, day, originalDate.getHours(), originalDate.getMinutes());

        // endAtも同様に調整
        let newEndAt: Date | null = null;
        if (publicSchedule.endAt) {
          const originalEndDate = new Date(publicSchedule.endAt);
          const duration = originalEndDate.getTime() - originalDate.getTime();
          newEndAt = new Date(newStartAt.getTime() + duration);
        }

        return ok({
          ...publicSchedule,
          id, // インスタンスIDを保持
          startAt: newStartAt.toISOString(),
          endAt: newEndAt ? newEndAt.toISOString() : null,
          supplement,
        });
      }

      return ok({
        ...publicSchedule,
        supplement,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type GetScheduleByIdUseCase = ReturnType<typeof createGetScheduleByIdUseCase>;
