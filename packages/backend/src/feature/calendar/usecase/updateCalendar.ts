import type { CalendarResponse, CalendarRole } from "@ai-scheduler/shared";
import type { CalendarMemberRepo } from "../../../domain/infra/calendarMemberRepo";
import type { CalendarRepo } from "../../../domain/infra/calendarRepo";
import type { UserRepo } from "../../../domain/infra/userRepo";
import {
  type UpdateCalendarInput,
  hasRequiredRole,
  updateCalendar as updateCalendarEntity,
} from "../../../domain/model/calendar";
import {
  createDatabaseError,
  createForbiddenError,
  createNotFoundError,
} from "../../../shared/errors";
import { type Result, err, ok } from "../../../shared/result";

export const createUpdateCalendarUseCase = (
  calendarRepo: CalendarRepo,
  calendarMemberRepo: CalendarMemberRepo,
  userRepo: UserRepo
) => {
  return async (
    calendarId: string,
    userId: string,
    input: UpdateCalendarInput
  ): Promise<Result<CalendarResponse>> => {
    try {
      const calendar = await calendarRepo.findById(calendarId);
      if (!calendar || calendar.deletedAt) {
        return err(createNotFoundError("カレンダー"));
      }

      // 権限チェック（owner/admin のみ更新可能）
      let role: CalendarRole;
      if (calendar.ownerId === userId) {
        role = "owner";
      } else {
        const member = await calendarMemberRepo.findByUserIdAndCalendarId(userId, calendarId);
        if (!member) {
          return err(createForbiddenError("このカレンダーへのアクセス権がありません"));
        }
        role = member.role;
      }

      if (!hasRequiredRole(role, "admin")) {
        return err(createForbiddenError("カレンダー設定の変更権限がありません"));
      }

      // カレンダーを更新
      const updatedCalendar = updateCalendarEntity(calendar, input);
      await calendarRepo.update(updatedCalendar);

      // オーナー情報を取得
      const owner = await userRepo.findById(calendar.ownerId);
      if (!owner) {
        return err(createDatabaseError("カレンダーオーナーが見つかりません"));
      }

      // メンバー数を取得
      const members = await calendarMemberRepo.findByCalendarId(calendarId);
      const memberCount = members.length + 1;

      const response: CalendarResponse = {
        id: updatedCalendar.id,
        name: updatedCalendar.name,
        color: updatedCalendar.color,
        role,
        memberCount,
        owner: {
          id: owner.id,
          name: owner.name,
          picture: owner.picture,
        },
        createdAt: updatedCalendar.createdAt,
        updatedAt: updatedCalendar.updatedAt,
      };

      return ok(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type UpdateCalendarUseCase = ReturnType<typeof createUpdateCalendarUseCase>;
