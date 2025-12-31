import type { SupplementRepo } from "../../../domain/infra/supplementRepo";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import {
  createSupplement,
  type Supplement,
  type SaveSupplementInput,
} from "../../../domain/model/supplement";
import { type Result, ok, err } from "../../../shared/result";
import { createNotFoundError } from "../../../shared/errors";

export const createSaveSupplementUseCase = (
  supplementRepo: SupplementRepo,
  scheduleRepo: ScheduleRepo
) => {
  return async (
    input: SaveSupplementInput & { aiResult: string }
  ): Promise<Result<Supplement>> => {
    // スケジュールの存在確認
    const schedule = await scheduleRepo.findById(input.scheduleId);
    if (!schedule) {
      return err(createNotFoundError("スケジュール"));
    }

    // 既存の補足情報があれば更新、なければ新規作成
    const existing = await supplementRepo.findByScheduleId(input.scheduleId);
    if (existing) {
      const updated: Supplement = {
        ...existing,
        keywords: input.keywords,
        aiResult: input.aiResult,
        updatedAt: new Date().toISOString(),
      };
      await supplementRepo.update(updated);
      return ok(updated);
    }

    const supplement = createSupplement(input);
    await supplementRepo.save(supplement);
    return ok(supplement);
  };
};

export type SaveSupplementUseCase = ReturnType<typeof createSaveSupplementUseCase>;
