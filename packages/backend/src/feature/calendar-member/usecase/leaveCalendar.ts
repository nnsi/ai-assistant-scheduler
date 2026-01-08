import type { CalendarRepo } from "../../../domain/infra/calendarRepo";
import type { CalendarMemberRepo } from "../../../domain/infra/calendarMemberRepo";
import { type Result, ok, err } from "../../../shared/result";
import {
  createDatabaseError,
  createNotFoundError,
  createForbiddenError,
} from "../../../shared/errors";

export const createLeaveCalendarUseCase = (
  calendarRepo: CalendarRepo,
  calendarMemberRepo: CalendarMemberRepo
) => {
  return async (calendarId: string, userId: string): Promise<Result<void>> => {
    try {
      const calendar = await calendarRepo.findById(calendarId);
      if (!calendar || calendar.deletedAt) {
        return err(createNotFoundError("カレンダー"));
      }

      // オーナーは離脱不可
      if (calendar.ownerId === userId) {
        return err(
          createForbiddenError(
            "オーナーはカレンダーから離脱できません。先にオーナー権限を移譲してください"
          )
        );
      }

      // メンバーかどうか確認
      const member = await calendarMemberRepo.findByUserIdAndCalendarId(
        userId,
        calendarId
      );
      if (!member) {
        return err(createNotFoundError("メンバーシップ"));
      }

      // メンバーを削除（離脱）
      await calendarMemberRepo.delete(member.id);

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type LeaveCalendarUseCase = ReturnType<typeof createLeaveCalendarUseCase>;
