import type { AiService } from "../../../domain/infra/aiService";
import { type Result, ok, err } from "../../../shared/result";
import { createAiError } from "../../../shared/errors";

export const createSearchWithKeywordsUseCase = (aiService: AiService) => {
  return async (
    title: string,
    startAt: string,
    keywords: string[]
  ): Promise<Result<string>> => {
    try {
      // AI検索実行
      const aiResult = await aiService.searchWithKeywords(title, startAt, keywords);
      return ok(aiResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createAiError(message));
    }
  };
};

export type SearchWithKeywordsUseCase = ReturnType<typeof createSearchWithKeywordsUseCase>;
