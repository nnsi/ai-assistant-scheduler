import type { AiService } from "../../../domain/infra/aiService";
import { type Result, ok, err } from "../../../shared/result";
import { createAiError } from "../../../shared/errors";

export const createSuggestKeywordsUseCase = (aiService: AiService) => {
  return async (title: string, startAt: string): Promise<Result<string[]>> => {
    try {
      const keywords = await aiService.suggestKeywords(title, startAt);
      return ok(keywords);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createAiError(message));
    }
  };
};

export type SuggestKeywordsUseCase = ReturnType<typeof createSuggestKeywordsUseCase>;
