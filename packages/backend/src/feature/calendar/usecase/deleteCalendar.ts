import type { CalendarRepo } from "../../../domain/infra/calendarRepo";
import { softDeleteCalendar } from "../../../domain/model/calendar";
import { type Result, ok, err } from "../../../shared/result";
import {
  createDatabaseError,
  createNotFoundError,
  createForbiddenError,
} from "../../../shared/errors";

export const createDeleteCalendarUseCase = (calendarRepo: CalendarRepo) => {
  return async (calendarId: string, userId: string): Promise<Result<void>> => {
    try {
      const calendar = await calendarRepo.findById(calendarId);
      if (!calendar || calendar.deletedAt) {
        return err(createNotFoundError("カレンダー"));
      }

      // オーナーのみ削除可能
      if (calendar.ownerId !== userId) {
        return err(createForbiddenError("カレンダーの削除はオーナーのみ可能です"));
      }

      // ソフトデリート
      const deletedCalendar = softDeleteCalendar(calendar);
      await calendarRepo.update(deletedCalendar);

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type DeleteCalendarUseCase = ReturnType<typeof createDeleteCalendarUseCase>;
