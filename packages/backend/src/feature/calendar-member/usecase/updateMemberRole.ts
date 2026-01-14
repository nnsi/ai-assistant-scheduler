import type { UpdateMemberRoleInput } from "@ai-scheduler/shared";
import type { CalendarMemberRepo } from "../../../domain/infra/calendarMemberRepo";
import type { CalendarRepo } from "../../../domain/infra/calendarRepo";
import {
  type CalendarRole,
  type MemberRole,
  hasRequiredRole,
} from "../../../domain/model/calendar";
import {
  createDatabaseError,
  createForbiddenError,
  createNotFoundError,
} from "../../../shared/errors";
import { type Result, err, ok } from "../../../shared/result";

export const createUpdateMemberRoleUseCase = (
  calendarRepo: CalendarRepo,
  calendarMemberRepo: CalendarMemberRepo
) => {
  return async (
    calendarId: string,
    targetUserId: string,
    operatorId: string,
    input: UpdateMemberRoleInput
  ): Promise<Result<void>> => {
    try {
      const calendar = await calendarRepo.findById(calendarId);
      if (!calendar || calendar.deletedAt) {
        return err(createNotFoundError("カレンダー"));
      }

      // オーナーの権限変更は不可
      if (targetUserId === calendar.ownerId) {
        return err(createForbiddenError("オーナーの権限は変更できません"));
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
        return err(createForbiddenError("メンバーの権限変更権限がありません"));
      }

      // admin権限付与はownerのみ可能
      if (input.role === "admin" && operatorRole !== "owner") {
        return err(createForbiddenError("admin権限の付与はオーナーのみ可能です"));
      }

      // 対象メンバーの確認（IDOR防止）
      const targetMember = await calendarMemberRepo.findByUserIdAndCalendarId(
        targetUserId,
        calendarId
      );
      if (!targetMember) {
        return err(createNotFoundError("メンバー"));
      }

      // 権限を更新
      await calendarMemberRepo.updateRole(targetMember.id, input.role as MemberRole);

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type UpdateMemberRoleUseCase = ReturnType<typeof createUpdateMemberRoleUseCase>;
