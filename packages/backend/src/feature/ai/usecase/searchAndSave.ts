import type { AgentType } from "@ai-scheduler/shared";
import type { SearchResult } from "../../../domain/infra/aiService";
import type { SearchWithKeywordsUseCase } from "./searchWithKeywords";
import type { SaveSupplementUseCase } from "./saveSupplement";
import { type Result, ok, err } from "../../../shared/result";

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
    agentTypes?: AgentType[]
  ): Promise<Result<SearchResult>> => {
    // 1. AI検索を実行
    const searchResult = await searchWithKeywords(
      userId,
      title,
      startAt,
      keywords,
      agentTypes
    );

    if (!searchResult.ok) {
      return searchResult;
    }

    // 2. 検索結果を保存（shopCandidatesも含めて）
    const saveResult = await saveSupplement(
      scheduleId,
      keywords,
      searchResult.value.result,
      searchResult.value.shopCandidates
    );

    if (!saveResult.ok) {
      return err(saveResult.error);
    }

    // 3. 検索結果を返す（レスポンスとして）
    return ok(searchResult.value);
  };
};

export type SearchAndSaveUseCase = ReturnType<typeof createSearchAndSaveUseCase>;
