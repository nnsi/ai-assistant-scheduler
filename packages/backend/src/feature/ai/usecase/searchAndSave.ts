import type { AgentType } from "@ai-scheduler/shared";
import type { ScheduleContext, SearchResult } from "../../../domain/infra/aiService";
import { type Result, err, ok } from "../../../shared/result";
import type { SaveSupplementUseCase } from "./saveSupplement";
import type { SearchWithKeywordsUseCase } from "./searchWithKeywords";

export const createSearchAndSaveUseCase = (
  searchWithKeywords: SearchWithKeywordsUseCase,
  saveSupplement: SaveSupplementUseCase
) => {
  return async (
    userId: string,
    scheduleId: string,
    title: string,
    startAt: string,
    keywords: string[],
    agentTypes?: AgentType[],
    scheduleContext?: ScheduleContext
  ): Promise<Result<SearchResult>> => {
    // 1. AI検索を実行
    const searchResult = await searchWithKeywords(
      userId,
      title,
      startAt,
      keywords,
      agentTypes,
      scheduleContext
    );

    if (!searchResult.ok) {
      return searchResult;
    }

    // 2. 検索結果を保存（shopCandidates, agentTypesも含めて）
    const saveResult = await saveSupplement(
      scheduleId,
      keywords,
      searchResult.value.result,
      searchResult.value.shopCandidates,
      agentTypes
    );

    if (!saveResult.ok) {
      return err(saveResult.error);
    }

    // 3. 検索結果を返す（レスポンスとして）
    return ok(searchResult.value);
  };
};

export type SearchAndSaveUseCase = ReturnType<typeof createSearchAndSaveUseCase>;
