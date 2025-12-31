import { Hono } from "hono";
import { createDb } from "../../infra/drizzle/client";
import { createScheduleRepo } from "../../infra/drizzle/scheduleRepo";
import { createSupplementRepo } from "../../infra/drizzle/supplementRepo";
import { createKeywordAgent, createSearchAgent } from "../../infra/mastra/agents";
import { createAiService } from "../../infra/mastra/aiService";
import { createMockAiService } from "../../infra/mock/aiService";
import { createSuggestKeywordsUseCase } from "./usecase/suggestKeywords";
import { createSearchWithKeywordsUseCase } from "./usecase/searchWithKeywords";
import { createSuggestKeywordsHandler } from "./handler/suggestKeywordsHandler";
import { createSearchHandler } from "./handler/searchHandler";

type Bindings = {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
  USE_MOCK_AI?: string;
};

type Variables = {
  suggestKeywords: ReturnType<typeof createSuggestKeywordsUseCase>;
  searchWithKeywords: ReturnType<typeof createSearchWithKeywordsUseCase>;
};

export const aiRoute = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// ミドルウェアでDIを解決
aiRoute.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  const scheduleRepo = createScheduleRepo(db);
  const supplementRepo = createSupplementRepo(db);

  // USE_MOCK_AI が "true" の場合はモックを使用
  const useMock = c.env.USE_MOCK_AI === "true";
  const aiService = useMock
    ? createMockAiService()
    : createAiService(
        createKeywordAgent(c.env.OPENROUTER_API_KEY),
        createSearchAgent(c.env.OPENROUTER_API_KEY)
      );

  c.set("suggestKeywords", createSuggestKeywordsUseCase(aiService));
  c.set(
    "searchWithKeywords",
    createSearchWithKeywordsUseCase(aiService, supplementRepo, scheduleRepo)
  );

  await next();
});

// POST /ai/suggest-keywords
aiRoute.post("/suggest-keywords", async (c) => {
  const handler = createSuggestKeywordsHandler(c.get("suggestKeywords"));
  return handler(c);
});

// POST /ai/search
aiRoute.post("/search", async (c) => {
  const handler = createSearchHandler(c.get("searchWithKeywords"));
  return handler(c);
});
