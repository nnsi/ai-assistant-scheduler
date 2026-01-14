import type { ShopList } from "@ai-scheduler/shared";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import type { SupplementRepo } from "../../../domain/infra/supplementRepo";
import { selectShops } from "../../../domain/model/supplement";
import { createForbiddenError, createNotFoundError } from "../../../shared/errors";
import { type Result, err, ok } from "../../../shared/result";

export const createSelectShopsUseCase = (
  supplementRepo: SupplementRepo,
  scheduleRepo: ScheduleRepo
) => {
  return async (scheduleId: string, shops: ShopList, userId: string): Promise<Result<void>> => {
    // スケジュールの存在確認と所有者チェック
    const schedule = await scheduleRepo.findById(scheduleId);
    if (!schedule) {
      return err(createNotFoundError("スケジュール"));
    }
    if (schedule.userId !== userId) {
      return err(createForbiddenError());
    }

    // 補足情報の存在確認
    const supplement = await supplementRepo.findByScheduleId(scheduleId);
    if (!supplement) {
      return err(createNotFoundError("補足情報"));
    }

    // お店を選択して更新（複数対応）
    const updated = selectShops(supplement, shops);
    await supplementRepo.update(updated);

    return ok(undefined);
  };
};

export type SelectShopsUseCase = ReturnType<typeof createSelectShopsUseCase>;
