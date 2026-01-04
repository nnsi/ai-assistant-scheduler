import type { Shop } from "@ai-scheduler/shared";
import type { SupplementRepo } from "../../../domain/infra/supplementRepo";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import { selectShop } from "../../../domain/model/supplement";
import { type Result, ok, err } from "../../../shared/result";
import { createNotFoundError, createForbiddenError } from "../../../shared/errors";

export const createSelectShopUseCase = (
  supplementRepo: SupplementRepo,
  scheduleRepo: ScheduleRepo
) => {
  return async (
    scheduleId: string,
    shop: Shop,
    userId: string
  ): Promise<Result<void>> => {
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

    // お店を選択して更新
    const updated = selectShop(supplement, shop);
    await supplementRepo.update(updated);

    return ok(undefined);
  };
};

export type SelectShopUseCase = ReturnType<typeof createSelectShopUseCase>;
