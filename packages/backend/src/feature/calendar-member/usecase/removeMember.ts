import type { CalendarMemberRepo } from "../../../domain/infra/calendarMemberRepo";
import type { CalendarRepo } from "../../../domain/infra/calendarRepo";
import { type CalendarRole, hasRequiredRole } from "../../../domain/model/calendar";
import {
  createDatabaseError,
  createForbiddenError,
  createNotFoundError,
} from "../../../shared/errors";
import { type Result, err, ok } from "../../../shared/result";

export const createRemoveMemberUseCase = (
  calendarRepo: CalendarRepo,
  calendarMemberRepo: CalendarMemberRepo
) => {
  return async (
    calendarId: string,
    targetUserId: string,
    operatorId: string
  ): Promise<Result<void>> => {
    try {
      const calendar = await calendarRepo.findById(calendarId);
      if (!calendar || calendar.deletedAt) {
        return err(createNotFoundError("カレンダー"));
      }

      // オーナーを削除しようとしている場合
      if (targetUserId === calendar.ownerId) {
        return err(createForbiddenError("オーナーは削除できません"));
      }

      // 操作者の権限チェック
      let operatorRole: CalendarRole;
      if (calendar.ownerId === operatorId) {
        operatorRole = "owner";
      } else {
        const operatorMember = await calendarMemberRepo.findByUserIdAndCalendarId(
          operatorId,
          calendarId
        );
        if (!operatorMember) {
          return err(createForbiddenError("このカレンダーへのアクセス権がありません"));
        }
        operatorRole = operatorMember.role;
      }

      if (!hasRequiredRole(operatorRole, "admin")) {
        return err(createForbiddenError("メンバー削除権限がありません"));
      }

      // 対象メンバーの確認（IDOR防止）
      const targetMember = await calendarMemberRepo.findByUserIdAndCalendarId(
        targetUserId,
        calendarId
      );
      if (!targetMember) {
        return err(createNotFoundError("メンバー"));
      }

      // メンバーを削除
      await calendarMemberRepo.delete(targetMember.id);

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type RemoveMemberUseCase = ReturnType<typeof createRemoveMemberUseCase>;
