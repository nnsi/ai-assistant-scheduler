import type { CalendarRepo } from "../../../domain/infra/calendarRepo";
import type { CalendarMemberRepo } from "../../../domain/infra/calendarMemberRepo";
import type { UserRepo } from "../../../domain/infra/userRepo";
import type { CalendarResponse, CalendarRole } from "@ai-scheduler/shared";
import { type Result, ok, err } from "../../../shared/result";
import { createDatabaseError } from "../../../shared/errors";

export const createGetCalendarsUseCase = (
  calendarRepo: CalendarRepo,
  calendarMemberRepo: CalendarMemberRepo,
  userRepo: UserRepo
) => {
  return async (userId: string): Promise<Result<CalendarResponse[]>> => {
    try {
      const calendars = await calendarRepo.findByUserId(userId);
      const members = await calendarMemberRepo.findByUserId(userId);

      // ユーザー情報をキャッシュ
      const userCache = new Map<
        string,
        { id: string; name: string; picture: string | null }
      >();

      const responses: CalendarResponse[] = [];

      for (const calendar of calendars) {
        // ロールを決定
        let role: CalendarRole;
        if (calendar.ownerId === userId) {
          role = "owner";
        } else {
          const member = members.find((m) => m.calendarId === calendar.id);
          role = member?.role ?? "viewer";
        }

        // オーナー情報を取得
        let owner = userCache.get(calendar.ownerId);
        if (!owner) {
          const ownerUser = await userRepo.findById(calendar.ownerId);
          if (ownerUser) {
            owner = {
              id: ownerUser.id,
              name: ownerUser.name,
              picture: ownerUser.picture,
            };
            userCache.set(calendar.ownerId, owner);
          }
        }

        if (!owner) {
          continue; // オーナーが見つからない場合はスキップ
        }

        // メンバー数を取得（オーナー + メンバー）
        const calendarMembers = await calendarMemberRepo.findByCalendarId(
          calendar.id
        );
        const memberCount = calendarMembers.length + 1; // +1 for owner

        responses.push({
          id: calendar.id,
          name: calendar.name,
          color: calendar.color,
          role,
          memberCount,
          owner,
          createdAt: calendar.createdAt,
          updatedAt: calendar.updatedAt,
        });
      }

      return ok(responses);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type GetCalendarsUseCase = ReturnType<typeof createGetCalendarsUseCase>;
