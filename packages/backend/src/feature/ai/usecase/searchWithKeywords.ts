import type { AiService } from "../../../domain/infra/aiService";
import type { SupplementRepo } from "../../../domain/infra/supplementRepo";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import { createSupplement, type Supplement } from "../../../domain/model/supplement";
import { type Result, ok, err } from "../../../shared/result";
import { createAiError, createNotFoundError } from "../../../shared/errors";

export const createSearchWithKeywordsUseCase = (
  aiService: AiService,
  supplementRepo: SupplementRepo,
  scheduleRepo: ScheduleRepo
) => {
  return async (
    scheduleId: string,
    title: string,
    startAt: string,
    keywords: string[]
  ): Promise<Result<Supplement>> => {
    try {
      // スケジュールの存在確認
      const schedule = await scheduleRepo.findById(scheduleId);
      if (!schedule) {
        return err(createNotFoundError("スケジュール"));
      }

      // AI検索実行
      const aiResult = await aiService.searchWithKeywords(title, startAt, keywords);

      // 既存の補足情報があれば更新、なければ新規作成
      const existing = await supplementRepo.findByScheduleId(scheduleId);
      if (existing) {
        const updated: Supplement = {
          ...existing,
          keywords,
          aiResult,
          updatedAt: new Date().toISOString(),
        };
        await supplementRepo.update(updated);
        return ok(updated);
      }

      const supplement = createSupplement({
        scheduleId,
        keywords,
        aiResult,
      });
      await supplementRepo.save(supplement);
      return ok(supplement);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createAiError(message));
    }
  };
};

export type SearchWithKeywordsUseCase = ReturnType<typeof createSearchWithKeywordsUseCase>;
