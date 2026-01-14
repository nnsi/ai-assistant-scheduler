import type { TransferOwnershipInput } from "@ai-scheduler/shared";
import type { CalendarMemberRepo } from "../../../domain/infra/calendarMemberRepo";
import type { CalendarRepo } from "../../../domain/infra/calendarRepo";
import { createCalendarMember } from "../../../domain/model/calendar";
import {
  createDatabaseError,
  createForbiddenError,
  createNotFoundError,
} from "../../../shared/errors";
import { type Result, err, ok } from "../../../shared/result";

export const createTransferOwnershipUseCase = (
  calendarRepo: CalendarRepo,
  calendarMemberRepo: CalendarMemberRepo
) => {
  return async (
    calendarId: string,
    currentOwnerId: string,
    input: TransferOwnershipInput
  ): Promise<Result<void>> => {
    try {
      const calendar = await calendarRepo.findById(calendarId);
      if (!calendar || calendar.deletedAt) {
        return err(createNotFoundError("カレンダー"));
      }

      // 現在のオーナーかどうか確認
      if (calendar.ownerId !== currentOwnerId) {
        return err(createForbiddenError("オーナー移譲はカレンダーオーナーのみ可能です"));
      }

      // 自分自身に移譲しようとしている場合
      if (input.newOwnerId === currentOwnerId) {
        return err(createForbiddenError("自分自身にオーナー権限を移譲することはできません"));
      }

      // 新しいオーナーがadminメンバーかどうか確認
      const newOwnerMember = await calendarMemberRepo.findByUserIdAndCalendarId(
        input.newOwnerId,
        calendarId
      );
      if (!newOwnerMember) {
        return err(createNotFoundError("新しいオーナー候補のメンバーシップ"));
      }
      if (newOwnerMember.role !== "admin") {
        return err(createForbiddenError("オーナー移譲はadmin権限を持つメンバーにのみ可能です"));
      }

      // 新しいオーナーのメンバーシップを削除（オーナーはcalendar_membersに含めない）
      await calendarMemberRepo.delete(newOwnerMember.id);

      // 元オーナーをadminとしてメンバーに追加
      const formerOwnerMember = createCalendarMember(
        calendarId,
        currentOwnerId,
        "admin",
        input.newOwnerId,
        true
      );
      await calendarMemberRepo.create(formerOwnerMember);

      // カレンダーのオーナーを更新
      const updatedCalendar = {
        ...calendar,
        ownerId: input.newOwnerId,
        updatedAt: new Date().toISOString(),
      };
      await calendarRepo.update(updatedCalendar);

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type TransferOwnershipUseCase = ReturnType<typeof createTransferOwnershipUseCase>;
