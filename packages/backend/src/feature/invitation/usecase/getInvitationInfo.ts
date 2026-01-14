import type { InvitationInfoResponse } from "@ai-scheduler/shared";
import type { CalendarInvitationRepo } from "../../../domain/infra/calendarInvitationRepo";
import type { CalendarRepo } from "../../../domain/infra/calendarRepo";
import type { UserRepo } from "../../../domain/infra/userRepo";
import { createDatabaseError, createNotFoundError } from "../../../shared/errors";
import { type Result, err, ok } from "../../../shared/result";

export const createGetInvitationInfoUseCase = (
  calendarRepo: CalendarRepo,
  calendarInvitationRepo: CalendarInvitationRepo,
  userRepo: UserRepo
) => {
  return async (token: string): Promise<Result<InvitationInfoResponse>> => {
    try {
      // 有効な招待リンクを取得
      const invitation = await calendarInvitationRepo.findByToken(token);
      if (!invitation) {
        return err(createNotFoundError("招待リンクが無効または期限切れです"));
      }

      // カレンダー情報を取得
      const calendar = await calendarRepo.findById(invitation.calendarId);
      if (!calendar || calendar.deletedAt) {
        return err(createNotFoundError("カレンダー"));
      }

      // オーナー情報を取得
      const owner = await userRepo.findById(calendar.ownerId);
      if (!owner) {
        return err(createDatabaseError("カレンダーオーナーが見つかりません"));
      }

      const response: InvitationInfoResponse = {
        calendarName: calendar.name,
        calendarColor: calendar.color,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        ownerName: owner.name,
      };

      return ok(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type GetInvitationInfoUseCase = ReturnType<typeof createGetInvitationInfoUseCase>;
