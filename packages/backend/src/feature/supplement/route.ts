import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { updateMemoInputSchema, selectShopsInputSchema } from "@ai-scheduler/shared";
import { createDb } from "../../infra/drizzle/client";
import { createSupplementRepo } from "../../infra/drizzle/supplementRepo";
import { createScheduleRepo } from "../../infra/drizzle/scheduleRepo";
import { createUpdateMemoUseCase } from "./usecase/updateMemo";
import { createSelectShopsUseCase } from "./usecase/selectShop";
import { createValidationError } from "../../shared/errors";
import { getStatusCode } from "../../shared/http";
import { authMiddleware } from "../../middleware/auth";

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

type Variables = {
  updateMemo: ReturnType<typeof createUpdateMemoUseCase>;
  selectShops: ReturnType<typeof createSelectShopsUseCase>;
  userId: string;
  userEmail: string;
};

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// 認証ミドルウェアを適用
app.use("*", authMiddleware);

// ミドルウェアでDIを解決
app.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  const supplementRepo = createSupplementRepo(db);
  const scheduleRepo = createScheduleRepo(db);

  c.set("updateMemo", createUpdateMemoUseCase(supplementRepo, scheduleRepo));
  c.set("selectShops", createSelectShopsUseCase(supplementRepo, scheduleRepo));

  await next();
});

export const supplementRoute = app
  // PUT /supplements/:scheduleId/memo
  .put(
    "/:scheduleId/memo",
    zValidator("json", updateMemoInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const scheduleId = c.req.param("scheduleId");
      const input = c.req.valid("json");
      const userId = c.get("userId");
      const result = await c.get("updateMemo")(scheduleId, input, userId);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json(result.value, 200);
    }
  )
  // PUT /supplements/:scheduleId/selected-shops
  .put(
    "/:scheduleId/selected-shops",
    zValidator("json", selectShopsInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const scheduleId = c.req.param("scheduleId");
      const { shops } = c.req.valid("json");
      const userId = c.get("userId");
      const result = await c.get("selectShops")(scheduleId, shops, userId);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.body(null, 204);
    }
  );
