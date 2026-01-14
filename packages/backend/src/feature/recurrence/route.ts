import {
  createRecurrenceRuleInputSchema,
  updateRecurrenceRuleInputSchema,
} from "@ai-scheduler/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createDb } from "../../infra/drizzle/client";
import { createRecurrenceRepo } from "../../infra/drizzle/recurrenceRepo";
import { createScheduleRepo } from "../../infra/drizzle/scheduleRepo";
import { authMiddleware } from "../../middleware/auth";
import { createValidationError } from "../../shared/errors";
import { getStatusCode } from "../../shared/http";
import { createCreateRecurrenceUseCase } from "./usecase/createRecurrence";
import { createDeleteRecurrenceUseCase } from "./usecase/deleteRecurrence";
import { createGetRecurrenceUseCase } from "./usecase/getRecurrence";
import { createUpdateRecurrenceUseCase } from "./usecase/updateRecurrence";

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

type Variables = {
  userId: string;
  userEmail: string;
  createRecurrence: ReturnType<typeof createCreateRecurrenceUseCase>;
  getRecurrence: ReturnType<typeof createGetRecurrenceUseCase>;
  updateRecurrence: ReturnType<typeof createUpdateRecurrenceUseCase>;
  deleteRecurrence: ReturnType<typeof createDeleteRecurrenceUseCase>;
};

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// 認証ミドルウェアを適用
app.use("*", authMiddleware);

// DIミドルウェア
app.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  const recurrenceRepo = createRecurrenceRepo(db);
  const scheduleRepo = createScheduleRepo(db);

  c.set("createRecurrence", createCreateRecurrenceUseCase(recurrenceRepo, scheduleRepo));
  c.set("getRecurrence", createGetRecurrenceUseCase(recurrenceRepo, scheduleRepo));
  c.set("updateRecurrence", createUpdateRecurrenceUseCase(recurrenceRepo, scheduleRepo));
  c.set("deleteRecurrence", createDeleteRecurrenceUseCase(recurrenceRepo, scheduleRepo));

  await next();
});

export const recurrenceRoute = app
  // GET /recurrence/:scheduleId - スケジュールの繰り返しルール取得
  .get("/:scheduleId", async (c) => {
    const scheduleId = c.req.param("scheduleId");
    const userId = c.get("userId");
    const result = await c.get("getRecurrence")(scheduleId, userId);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json(result.value, 200);
  })
  // POST /recurrence/:scheduleId - 繰り返しルール作成
  .post(
    "/:scheduleId",
    zValidator("json", createRecurrenceRuleInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const scheduleId = c.req.param("scheduleId");
      const input = c.req.valid("json");
      const userId = c.get("userId");
      const result = await c.get("createRecurrence")(scheduleId, input, userId);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json(result.value, 201);
    }
  )
  // PUT /recurrence/:scheduleId - 繰り返しルール更新
  .put(
    "/:scheduleId",
    zValidator("json", updateRecurrenceRuleInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const scheduleId = c.req.param("scheduleId");
      const userId = c.get("userId");
      const input = c.req.valid("json");
      const result = await c.get("updateRecurrence")(scheduleId, input, userId);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json(result.value, 200);
    }
  )
  // DELETE /recurrence/:scheduleId - 繰り返しルール削除
  .delete("/:scheduleId", async (c) => {
    const scheduleId = c.req.param("scheduleId");
    const userId = c.get("userId");
    const result = await c.get("deleteRecurrence")(scheduleId, userId);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.body(null, 204);
  });
