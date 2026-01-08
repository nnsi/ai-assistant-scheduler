import type { CalendarRepo } from "../../../domain/infra/calendarRepo";
import type { CalendarMemberRepo } from "../../../domain/infra/calendarMemberRepo";
import type { CalendarInvitationRepo } from "../../../domain/infra/calendarInvitationRepo";
import { createCalendarMember, type MemberRole } from "../../../domain/model/calendar";
import { type Result, ok, err } from "../../../shared/result";
import {
  createDatabaseError,
  createNotFoundError,
  createConflictError,
} from "../../../shared/errors";

export const createAcceptInvitationUseCase = (
  calendarRepo: CalendarRepo,
  calendarMemberRepo: CalendarMemberRepo,
  calendarInvitationRepo: CalendarInvitationRepo
) => {
  return async (token: string, userId: string): Promise<Result<{ calendarId: string }>> => {
    try {
      // 原子的にuse_countをインクリメント（レースコンディション対策）
      const invitation = await calendarInvitationRepo.incrementUseCount(token);
      if (!invitation) {
        return err(createNotFoundError("招待リンクが無効、期限切れ、または使用回数上限に達しています"));
      }

      // カレンダーの存在確認
      const calendar = await calendarRepo.findById(invitation.calendarId);
      if (!calendar || calendar.deletedAt) {
        return err(createNotFoundError("カレンダー"));
      }

      // オーナーが自分自身の招待を受けようとしている場合
      if (calendar.ownerId === userId) {
        return err(createConflictError("あなたはこのカレンダーのオーナーです"));
      }

      // 既にメンバーか確認
      const existingMember = await calendarMemberRepo.findByUserIdAndCalendarId(
        userId,
        invitation.calendarId
      );
      if (existingMember) {
        return err(createConflictError("すでにこのカレンダーのメンバーです"));
      }

      // メンバーを追加
      const member = createCalendarMember(
        invitation.calendarId,
        userId,
        invitation.role as MemberRole,
        invitation.createdBy,
        true // accepted
      );
      await calendarMemberRepo.create(member);

      return ok({ calendarId: invitation.calendarId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type AcceptInvitationUseCase = ReturnType<typeof createAcceptInvitationUseCase>;
