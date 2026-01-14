import type { CalendarInvitationRepo } from "../../../domain/infra/calendarInvitationRepo";
import type { CalendarMemberRepo } from "../../../domain/infra/calendarMemberRepo";
import type { CalendarRepo } from "../../../domain/infra/calendarRepo";
import { type CalendarRole, hasRequiredRole } from "../../../domain/model/calendar";
import {
  createDatabaseError,
  createForbiddenError,
  createNotFoundError,
} from "../../../shared/errors";
import { type Result, err, ok } from "../../../shared/result";

export const createRevokeInvitationUseCase = (
  calendarRepo: CalendarRepo,
  calendarMemberRepo: CalendarMemberRepo,
  calendarInvitationRepo: CalendarInvitationRepo
) => {
  return async (
    calendarId: string,
    invitationId: string,
    userId: string
  ): Promise<Result<void>> => {
    try {
      const calendar = await calendarRepo.findById(calendarId);
      if (!calendar || calendar.deletedAt) {
        return err(createNotFoundError("カレンダー"));
      }

      // 権限チェック（admin以上のみ招待リンク削除可能）
      let operatorRole: CalendarRole;
      if (calendar.ownerId === userId) {
        operatorRole = "owner";
      } else {
        const operatorMember = await calendarMemberRepo.findByUserIdAndCalendarId(
          userId,
          calendarId
        );
        if (!operatorMember) {
          return err(createForbiddenError("このカレンダーへのアクセス権がありません"));
        }
        operatorRole = operatorMember.role;
      }

      if (!hasRequiredRole(operatorRole, "admin")) {
        return err(createForbiddenError("招待リンク削除権限がありません"));
      }

      // 招待リンクの存在とカレンダーの一致を確認（IDOR防止）
      const invitation = await calendarInvitationRepo.findById(invitationId);
      if (!invitation || invitation.calendarId !== calendarId) {
        return err(createNotFoundError("招待リンク"));
      }

      // 招待リンクを削除
      await calendarInvitationRepo.delete(invitationId);

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type RevokeInvitationUseCase = ReturnType<typeof createRevokeInvitationUseCase>;
