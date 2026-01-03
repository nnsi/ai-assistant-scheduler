import type { AiService, UserConditions } from "../../../domain/infra/aiService";
import type { ProfileRepo } from "../../../domain/infra/profileRepo";
import { type Result, ok, err } from "../../../shared/result";
import { createAiError } from "../../../shared/errors";

export const createSuggestKeywordsUseCase = (
  aiService: AiService,
  profileRepo: ProfileRepo
) => {
  return async (
    userId: string,
    title: string,
    startAt: string,
    excludeKeywords?: string[]
  ): Promise<Result<string[]>> => {
    try {
      // ユーザーのプロファイルを取得
      const profile = await profileRepo.findByUserId(userId);

      // プロファイルがあれば条件を抽出
      let userConditions: UserConditions | undefined;
      if (profile) {
        userConditions = {
          required: profile.requiredConditions,
          preferred: profile.preferredConditions,
          subjective: profile.subjectiveConditions,
        };
      }

      const keywords = await aiService.suggestKeywords(
        title,
        startAt,
        userConditions,
        excludeKeywords
      );
      return ok(keywords);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createAiError(message));
    }
  };
};

export type SuggestKeywordsUseCase = ReturnType<typeof createSuggestKeywordsUseCase>;
