import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import { suggestKeywordsInputSchema, searchInputSchema, searchAndSaveInputSchema } from "@ai-scheduler/shared";
import type { StreamEvent } from "../../domain/infra/aiService";
import {
  createKeywordAgent,
  createSearchAgent,
  createPlanAgent,
  createAreaInfoAgent,
} from "../../infra/mastra/agents";
import { createAiService } from "../../infra/mastra/aiService";
import { createMockAiService } from "../../infra/mock/aiService";
import { createDb } from "../../infra/drizzle/client";
import { createProfileRepo } from "../../infra/drizzle/profileRepo";
import { createSupplementRepo } from "../../infra/drizzle/supplementRepo";
import { createSuggestKeywordsUseCase } from "./usecase/suggestKeywords";
import { createSearchWithKeywordsUseCase } from "./usecase/searchWithKeywords";
import { createSaveSupplementUseCase } from "./usecase/saveSupplement";
import { createSearchAndSaveUseCase } from "./usecase/searchAndSave";
import { createValidationError } from "../../shared/errors";
import { getStatusCode } from "../../shared/http";
import { authMiddleware } from "../../middleware/auth";
import { aiRateLimitMiddleware } from "../../middleware/rateLimit";

type Bindings = {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
  USE_MOCK_AI?: string;
  JWT_SECRET: string;
  RATE_LIMIT_KV?: KVNamespace;
};

type Variables = {
  suggestKeywords: ReturnType<typeof createSuggestKeywordsUseCase>;
  searchWithKeywords: ReturnType<typeof createSearchWithKeywordsUseCase>;
  searchAndSave: ReturnType<typeof createSearchAndSaveUseCase>;
  aiService: ReturnType<typeof createAiService>;
  profileRepo: ReturnType<typeof createProfileRepo>;
  userId: string;
  userEmail: string;
};

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// 認証ミドルウェアを適用（AIルートは認証必須）
app.use("*", authMiddleware);

// レート制限ミドルウェアを適用（1時間あたり10リクエスト）
app.use("*", aiRateLimitMiddleware);

// ミドルウェアでDIを解決
app.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  const profileRepo = createProfileRepo(db);
  const supplementRepo = createSupplementRepo(db);

  // USE_MOCK_AI が "true" の場合はモックを使用
  const useMock = c.env.USE_MOCK_AI === "true";
  const aiService = useMock
    ? createMockAiService()
    : createAiService(createKeywordAgent(c.env.OPENROUTER_API_KEY), {
        search: createSearchAgent(c.env.OPENROUTER_API_KEY),
        plan: createPlanAgent(c.env.OPENROUTER_API_KEY),
        "area-info": createAreaInfoAgent(c.env.OPENROUTER_API_KEY),
      });

  const searchWithKeywords = createSearchWithKeywordsUseCase(aiService, profileRepo);
  const saveSupplement = createSaveSupplementUseCase(supplementRepo);

  c.set("suggestKeywords", createSuggestKeywordsUseCase(aiService, profileRepo));
  c.set("searchWithKeywords", searchWithKeywords);
  c.set("searchAndSave", createSearchAndSaveUseCase(searchWithKeywords, saveSupplement));
  c.set("aiService", aiService);
  c.set("profileRepo", profileRepo);

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
      const userId = c.get("userId");
      const { title, startAt, excludeKeywords } = c.req.valid("json");
      const result = await c.get("suggestKeywords")(userId, title, startAt, excludeKeywords);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json(
        { keywords: result.value.keywords, agentTypes: result.value.agentTypes },
        200
      );
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
      const userId = c.get("userId");
      const { title, startAt, keywords, agentTypes } = c.req.valid("json");
      const result = await c.get("searchWithKeywords")(
        userId,
        title,
        startAt,
        keywords,
        agentTypes
      );

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json({
        result: result.value.result,
        shopCandidates: result.value.shopCandidates,
      }, 200);
    }
  )
  // POST /ai/search-and-save
  .post(
    "/search-and-save",
    zValidator("json", searchAndSaveInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const userId = c.get("userId");
      const { scheduleId, title, startAt, keywords, agentTypes } = c.req.valid("json");
      const result = await c.get("searchAndSave")(
        userId,
        scheduleId,
        title,
        startAt,
        keywords,
        agentTypes
      );

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json({
        result: result.value.result,
        shopCandidates: result.value.shopCandidates,
      }, 200);
    }
  )
  // POST /ai/search/stream - SSEストリーミング
  .post(
    "/search/stream",
    zValidator("json", searchInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const userId = c.get("userId");
      const { title, startAt, keywords, agentTypes } = c.req.valid("json");
      const aiService = c.get("aiService");
      const profileRepo = c.get("profileRepo");

      // ストリーミングがサポートされていない場合はエラー
      if (!aiService.searchWithKeywordsStream) {
        return c.json({ code: "NOT_IMPLEMENTED", message: "Streaming not supported" }, 501);
      }

      // ユーザーのプロファイルを取得
      const profile = await profileRepo.findByUserId(userId);
      const userConditions = profile
        ? {
            required: profile.requiredConditions,
            preferred: profile.preferredConditions,
            subjective: profile.subjectiveConditions,
          }
        : undefined;

      return streamSSE(c, async (stream) => {
        let eventId = 0;

        try {
          const generator = aiService.searchWithKeywordsStream!(
            title,
            startAt,
            keywords,
            agentTypes ?? ["search"],
            userConditions
          );

          for await (const event of generator) {
            await stream.writeSSE({
              data: JSON.stringify(event),
              event: event.type,
              id: String(eventId++),
            });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          await stream.writeSSE({
            data: JSON.stringify({ type: "error", message } satisfies StreamEvent),
            event: "error",
            id: String(eventId++),
          });
        }
      });
    }
  )
  // POST /ai/search-and-save/stream - SSEストリーミング＋保存
  .post(
    "/search-and-save/stream",
    zValidator("json", searchAndSaveInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const userId = c.get("userId");
      const { scheduleId, title, startAt, keywords, agentTypes } = c.req.valid("json");
      const aiService = c.get("aiService");
      const profileRepo = c.get("profileRepo");

      // ストリーミングがサポートされていない場合はエラー
      if (!aiService.searchWithKeywordsStream) {
        return c.json({ code: "NOT_IMPLEMENTED", message: "Streaming not supported" }, 501);
      }

      // ユーザーのプロファイルを取得
      const profile = await profileRepo.findByUserId(userId);
      const userConditions = profile
        ? {
            required: profile.requiredConditions,
            preferred: profile.preferredConditions,
            subjective: profile.subjectiveConditions,
          }
        : undefined;

      // 保存用の依存関係を準備
      const db = createDb(c.env.DB);
      const supplementRepo = createSupplementRepo(db);
      const saveSupplement = createSaveSupplementUseCase(supplementRepo);

      return streamSSE(c, async (stream) => {
        let eventId = 0;
        let fullText = "";
        let shopCandidates: import("@ai-scheduler/shared").Shop[] | undefined;

        try {
          const generator = aiService.searchWithKeywordsStream!(
            title,
            startAt,
            keywords,
            agentTypes ?? ["search"],
            userConditions
          );

          for await (const event of generator) {
            // テキストイベントの場合は蓄積
            if (event.type === "text") {
              fullText += event.content;
            } else if (event.type === "done") {
              shopCandidates = event.shopCandidates;
            }

            await stream.writeSSE({
              data: JSON.stringify(event),
              event: event.type,
              id: String(eventId++),
            });
          }

          // ストリーミング完了後に保存
          await saveSupplement(scheduleId, keywords, fullText, shopCandidates);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          await stream.writeSSE({
            data: JSON.stringify({ type: "error", message } satisfies StreamEvent),
            event: "error",
            id: String(eventId++),
          });
        }
      });
    }
  );
