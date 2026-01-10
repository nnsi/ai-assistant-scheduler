import type { SupplementRepo } from "../../../domain/infra/supplementRepo";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import {
  updateSupplementMemo,
  createSupplementForMemo,
  type Supplement,
  type UpdateMemoInput,
} from "../../../domain/model/supplement";
import { type Result, ok, err } from "../../../shared/result";
import {
  createDatabaseError,
  createForbiddenError,
} from "../../../shared/errors";

// 繰り返し予定インスタンスIDのパターン: parentId_YYYY-MM-DD
const OCCURRENCE_ID_PATTERN = /^(.+)_(\d{4}-\d{2}-\d{2})$/;

// インスタンスIDから親IDを抽出
const getParentScheduleId = (id: string): string => {
  const match = id.match(OCCURRENCE_ID_PATTERN);
  return match ? match[1] : id;
};

export const createUpdateMemoUseCase = (
  supplementRepo: SupplementRepo,
  scheduleRepo: ScheduleRepo
) => {
  return async (
    scheduleId: string,
    input: UpdateMemoInput,
    userId: string
  ): Promise<Result<Supplement>> => {
    try {
      // インスタンスIDの場合は親IDを取得
      const parentScheduleId = getParentScheduleId(scheduleId);

      // スケジュールの所有権を確認
      const schedule = await scheduleRepo.findByIdAndUserId(parentScheduleId, userId);
      if (!schedule) {
        return err(createForbiddenError("このスケジュールへのアクセス権がありません"));
      }

      const existing = await supplementRepo.findByScheduleId(parentScheduleId);

      let updated: Supplement;
      if (existing) {
        // 既存のsupplementを更新
        updated = updateSupplementMemo(existing, input);
        await supplementRepo.update(updated);
      } else {
        // AI検索なしの予定の場合、新規作成
        updated = createSupplementForMemo(parentScheduleId, input.userMemo);
        await supplementRepo.save(updated);
      }
      return ok(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};

export type UpdateMemoUseCase = ReturnType<typeof createUpdateMemoUseCase>;
