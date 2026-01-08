import type { CalendarRepo } from "../../../domain/infra/calendarRepo";
import type { CalendarMemberRepo } from "../../../domain/infra/calendarMemberRepo";
import type { UserRepo } from "../../../domain/infra/userRepo";
import {
  createCalendarMember,
  hasRequiredRole,
  type MemberRole,
  type CalendarRole,
} from "../../../domain/model/calendar";
import type { CalendarMemberResponse, AddMemberInput } from "@ai-scheduler/shared";
import { type Result, ok, err } from "../../../shared/result";
import {
  createDatabaseError,
  createNotFoundError,
  createForbiddenError,
  createConflictError,
} from "../../../shared/errors";

export const createAddMemberUseCase = (
  calendarRepo: CalendarRepo,
  calendarMemberRepo: CalendarMemberRepo,
  userRepo: UserRepo
) => {
  return async (
    calendarId: string,
    userId: string,
    input: AddMemberInput
  ): Promise<Result<CalendarMemberResponse>> => {
    try {
      const calendar = await calendarRepo.findById(calendarId);
      if (!calendar || calendar.deletedAt) {
        return err(createNotFoundError("カレンダー"));
      }

      // 権限チェック（admin以上のみメンバー追加可能）
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
        return err(createForbiddenError("メンバー追加権限がありません"));
      }

      // admin権限付与はownerのみ可能
      if (input.role === "admin" && operatorRole !== "owner") {
        return err(createForbiddenError("admin権限の付与はオーナーのみ可能です"));
      }

      // 招待対象ユーザーを検索
      const targetUser = await userRepo.findByEmail(input.email);
      if (!targetUser) {
        return err(createNotFoundError("ユーザー"));
      }

      // オーナー自身を追加しようとしている場合
      if (targetUser.id === calendar.ownerId) {
        return err(createConflictError("カレンダーオーナーをメンバーとして追加することはできません"));
      }

      // 既にメンバーか確認
      const existingMember = await calendarMemberRepo.findByUserIdAndCalendarId(
        targetUser.id,
        calendarId
      );
      if (existingMember) {
        return err(createConflictError("このユーザーは既にメンバーです"));
      }

      // メンバーを追加
      const member = createCalendarMember(
        calendarId,
        targetUser.id,
        input.role as MemberRole,
        userId,
        true // accepted immediately
      );
      await calendarMemberRepo.create(member);

      const response: CalendarMemberResponse = {
        id: member.id,
        userId: member.userId,
        role: member.role,
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          picture: targetUser.picture,
        },
        invitedBy: member.invitedBy,
        acceptedAt: member.acceptedAt,
        createdAt: member.createdAt,
      };

      return ok(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type AddMemberUseCase = ReturnType<typeof createAddMemberUseCase>;
