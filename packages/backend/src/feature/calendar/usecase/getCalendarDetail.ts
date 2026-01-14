import type { CalendarResponse, CalendarRole } from "@ai-scheduler/shared";
import type { CalendarMemberRepo } from "../../../domain/infra/calendarMemberRepo";
import type { CalendarRepo } from "../../../domain/infra/calendarRepo";
import type { UserRepo } from "../../../domain/infra/userRepo";
import {
  createDatabaseError,
  createForbiddenError,
  createNotFoundError,
} from "../../../shared/errors";
import { type Result, err, ok } from "../../../shared/result";

export const createGetCalendarDetailUseCase = (
  calendarRepo: CalendarRepo,
  calendarMemberRepo: CalendarMemberRepo,
  userRepo: UserRepo
) => {
  return async (calendarId: string, userId: string): Promise<Result<CalendarResponse>> => {
    try {
      const calendar = await calendarRepo.findById(calendarId);
      if (!calendar || calendar.deletedAt) {
        return err(createNotFoundError("カレンダー"));
      }

      // アクセス権チェック
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

      // オーナー情報を取得
      const owner = await userRepo.findById(calendar.ownerId);
      if (!owner) {
        return err(createDatabaseError("カレンダーオーナーが見つかりません"));
      }

      // メンバー数を取得
      const members = await calendarMemberRepo.findByCalendarId(calendarId);
      const memberCount = members.length + 1; // +1 for owner

      const response: CalendarResponse = {
        id: calendar.id,
        name: calendar.name,
        color: calendar.color,
        role,
        memberCount,
        owner: {
          id: owner.id,
          name: owner.name,
          picture: owner.picture,
        },
        createdAt: calendar.createdAt,
        updatedAt: calendar.updatedAt,
      };

      return ok(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type GetCalendarDetailUseCase = ReturnType<typeof createGetCalendarDetailUseCase>;
