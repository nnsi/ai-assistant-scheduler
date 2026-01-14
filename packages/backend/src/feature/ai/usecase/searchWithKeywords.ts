import type { AgentType } from "@ai-scheduler/shared";
import type {
  AiService,
  ScheduleContext,
  SearchResult,
  UserConditions,
} from "../../../domain/infra/aiService";
import type { ProfileRepo } from "../../../domain/infra/profileRepo";
import { createAiError } from "../../../shared/errors";
import { type Result, err, ok } from "../../../shared/result";

export const createSearchWithKeywordsUseCase = (aiService: AiService, profileRepo: ProfileRepo) => {
  return async (
    userId: string,
    title: string,
    startAt: string,
    keywords: string[],
    agentTypes?: AgentType[],
    scheduleContext?: ScheduleContext
  ): Promise<Result<SearchResult>> => {
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

      // AI検索実行（ユーザー条件とスケジュールコンテキストを渡す）
      const aiResult = await aiService.searchWithKeywords(
        title,
        startAt,
        keywords,
        agentTypes?.length ? agentTypes : ["search"],
        userConditions,
        scheduleContext
      );
      return ok(aiResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createAiError(message));
    }
  };
};

export type SearchWithKeywordsUseCase = ReturnType<typeof createSearchWithKeywordsUseCase>;
