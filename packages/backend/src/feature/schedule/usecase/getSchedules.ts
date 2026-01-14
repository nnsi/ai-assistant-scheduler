import type { Schedule } from "@ai-scheduler/shared";
import type { CalendarRepo } from "../../../domain/infra/calendarRepo";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import { toPublicSchedule } from "../../../domain/model/schedule";
import { type Result, ok } from "../../../shared/result";

export const createGetSchedulesUseCase = (repo: ScheduleRepo, calendarRepo: CalendarRepo) => {
  return async (userId: string, year?: number, month?: number): Promise<Result<Schedule[]>> => {
    // ユーザーがアクセスできる全てのカレンダーを取得（オーナー + メンバー）
    const calendars = await calendarRepo.findByUserId(userId);
    const calendarIds = calendars.map((c) => c.id);

    // カレンダーIDに紐づくスケジュール + calendarIdがnullの既存スケジュール
    if (year !== undefined && month !== undefined) {
      const schedules = await repo.findByMonthAndCalendarIdsOrUserId(
        year,
        month,
        calendarIds,
        userId
      );
      return ok(schedules.map(toPublicSchedule));
    }
    const schedules = await repo.findByCalendarIdsOrUserId(calendarIds, userId);
    return ok(schedules.map(toPublicSchedule));
  };
};

export type GetSchedulesUseCase = ReturnType<typeof createGetSchedulesUseCase>;
