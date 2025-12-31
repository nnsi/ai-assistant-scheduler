import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { suggestKeywordsInputSchema, searchInputSchema } from "@ai-scheduler/shared";
import { createKeywordAgent, createSearchAgent } from "../../infra/mastra/agents";
import { createAiService } from "../../infra/mastra/aiService";
import { createMockAiService } from "../../infra/mock/aiService";
import { createSuggestKeywordsUseCase } from "./usecase/suggestKeywords";
import { createSearchWithKeywordsUseCase } from "./usecase/searchWithKeywords";
import { createValidationError } from "../../shared/errors";
import { getStatusCode } from "../../shared/http";

type Bindings = {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
  USE_MOCK_AI?: string;
};

type Variables = {
  suggestKeywords: ReturnType<typeof createSuggestKeywordsUseCase>;
  searchWithKeywords: ReturnType<typeof createSearchWithKeywordsUseCase>;
};

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// ミドルウェアでDIを解決
app.use("*", async (c, next) => {
  // USE_MOCK_AI が "true" の場合はモックを使用
  const useMock = c.env.USE_MOCK_AI === "true";
  const aiService = useMock
    ? createMockAiService()
    : createAiService(
        createKeywordAgent(c.env.OPENROUTER_API_KEY),
        createSearchAgent(c.env.OPENROUTER_API_KEY)
      );

  c.set("suggestKeywords", createSuggestKeywordsUseCase(aiService));
  c.set("searchWithKeywords", createSearchWithKeywordsUseCase(aiService));

  await next();
});

export const aiRoute = app
  // POST /ai/suggest-keywords
  .post(
    "/suggest-keywords",
    zValidator("json", suggestKeywordsInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const { title, startAt } = c.req.valid("json");
      const result = await c.get("suggestKeywords")(title, startAt);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json({ keywords: result.value }, 200);
    }
  )
  // POST /ai/search
  .post(
    "/search",
    zValidator("json", searchInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const { title, startAt, keywords } = c.req.valid("json");
      const result = await c.get("searchWithKeywords")(title, startAt, keywords);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json({ result: result.value }, 200);
    }
  );
