import type { InvitationListItemResponse } from "@ai-scheduler/shared";
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

// トークンをマスク表示用に変換
const maskToken = (token: string): string => {
  if (token.length <= 10) {
    return `${token.substring(0, 3)}...`;
  }
  return `${token.substring(0, 5)}...${token.substring(token.length - 3)}`;
};

export const createGetInvitationsUseCase = (
  calendarRepo: CalendarRepo,
  calendarMemberRepo: CalendarMemberRepo,
  calendarInvitationRepo: CalendarInvitationRepo
) => {
  return async (
    calendarId: string,
    userId: string
  ): Promise<Result<InvitationListItemResponse[]>> => {
    try {
      const calendar = await calendarRepo.findById(calendarId);
      if (!calendar || calendar.deletedAt) {
        return err(createNotFoundError("カレンダー"));
      }

      // 権限チェック（admin以上のみ招待リンク一覧を表示可能）
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
        return err(createForbiddenError("招待リンク一覧の表示権限がありません"));
      }

      // 招待リンク一覧を取得
      const invitations = await calendarInvitationRepo.findByCalendarId(calendarId);

      const responses: InvitationListItemResponse[] = invitations.map((inv) => ({
        id: inv.id,
        tokenPreview: maskToken(inv.token),
        role: inv.role,
        expiresAt: inv.expiresAt,
        maxUses: inv.maxUses,
        useCount: inv.useCount,
        createdAt: inv.createdAt,
      }));

      return ok(responses);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type GetInvitationsUseCase = ReturnType<typeof createGetInvitationsUseCase>;
