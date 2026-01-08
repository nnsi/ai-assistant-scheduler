import type { CalendarRepo } from "../../../domain/infra/calendarRepo";
import type { CalendarMemberRepo } from "../../../domain/infra/calendarMemberRepo";
import type { CalendarInvitationRepo } from "../../../domain/infra/calendarInvitationRepo";
import { hasRequiredRole, type CalendarRole, type CalendarInvitationEntity } from "../../../domain/model/calendar";
import { generateId, generateSecureToken } from "../../../shared/id";
import type { CreateInvitationInput, CreateInvitationResponse } from "@ai-scheduler/shared";
import { type Result, ok, err } from "../../../shared/result";
import {
  createDatabaseError,
  createNotFoundError,
  createForbiddenError,
} from "../../../shared/errors";

export const createCreateInvitationUseCase = (
  calendarRepo: CalendarRepo,
  calendarMemberRepo: CalendarMemberRepo,
  calendarInvitationRepo: CalendarInvitationRepo,
  getBaseUrl: () => string
) => {
  return async (
    calendarId: string,
    userId: string,
    input: CreateInvitationInput
  ): Promise<Result<CreateInvitationResponse>> => {
    try {
      const calendar = await calendarRepo.findById(calendarId);
      if (!calendar || calendar.deletedAt) {
        return err(createNotFoundError("カレンダー"));
      }

      // 権限チェック（admin以上のみ招待リンク作成可能）
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
        return err(createForbiddenError("招待リンク作成権限がありません"));
      }

      // 招待リンクを作成
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + (input.expiresInDays ?? 7) * 24 * 60 * 60 * 1000
      );
      const token = generateSecureToken();

      const invitation: CalendarInvitationEntity = {
        id: generateId(),
        calendarId,
        token,
        role: input.role,
        expiresAt: expiresAt.toISOString(),
        maxUses: input.maxUses ?? null,
        useCount: 0,
        createdBy: userId,
        createdAt: now.toISOString(),
      };

      await calendarInvitationRepo.create(invitation);

      const baseUrl = getBaseUrl();
      const response: CreateInvitationResponse = {
        id: invitation.id,
        token: invitation.token,
        url: `${baseUrl}/invite/${invitation.token}`,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        maxUses: invitation.maxUses,
      };

      return ok(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type CreateInvitationUseCase = ReturnType<typeof createCreateInvitationUseCase>;
