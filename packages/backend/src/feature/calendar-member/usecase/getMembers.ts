import type { CalendarRepo } from "../../../domain/infra/calendarRepo";
import type { CalendarMemberRepo } from "../../../domain/infra/calendarMemberRepo";
import type { UserRepo } from "../../../domain/infra/userRepo";
import type { CalendarMemberResponse } from "@ai-scheduler/shared";
import { type Result, ok, err } from "../../../shared/result";
import {
  createDatabaseError,
  createNotFoundError,
  createForbiddenError,
} from "../../../shared/errors";

export const createGetMembersUseCase = (
  calendarRepo: CalendarRepo,
  calendarMemberRepo: CalendarMemberRepo,
  userRepo: UserRepo
) => {
  return async (
    calendarId: string,
    userId: string
  ): Promise<Result<CalendarMemberResponse[]>> => {
    try {
      const calendar = await calendarRepo.findById(calendarId);
      if (!calendar || calendar.deletedAt) {
        return err(createNotFoundError("カレンダー"));
      }

      // アクセス権チェック
      const isOwner = calendar.ownerId === userId;
      if (!isOwner) {
        const member = await calendarMemberRepo.findByUserIdAndCalendarId(
          userId,
          calendarId
        );
        if (!member) {
          return err(createForbiddenError("このカレンダーへのアクセス権がありません"));
        }
      }

      // メンバー一覧を取得
      const members = await calendarMemberRepo.findByCalendarId(calendarId);

      // オーナー情報を取得
      const owner = await userRepo.findById(calendar.ownerId);
      if (!owner) {
        return err(createDatabaseError("カレンダーオーナーが見つかりません"));
      }

      // オーナーを含むメンバーリストを構築
      const responses: CalendarMemberResponse[] = [
        {
          id: `owner-${owner.id}`,
          userId: owner.id,
          role: "owner",
          user: {
            id: owner.id,
            name: owner.name,
            email: owner.email,
            picture: owner.picture,
          },
          invitedBy: null,
          acceptedAt: calendar.createdAt,
          createdAt: calendar.createdAt,
        },
        ...members.map((member) => ({
          id: member.id,
          userId: member.userId,
          role: member.role as "admin" | "editor" | "viewer",
          user: member.user,
          invitedBy: member.invitedBy,
          acceptedAt: member.acceptedAt,
          createdAt: member.createdAt,
        })),
      ];

      return ok(responses);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type GetMembersUseCase = ReturnType<typeof createGetMembersUseCase>;
