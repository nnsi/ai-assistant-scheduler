import {
  createScheduleInputSchema,
  updateMemoInputSchema,
  updateScheduleInputSchema,
} from "@ai-scheduler/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { createCreateScheduleUseCase } from "../feature/schedule/usecase/createSchedule";
import { createDeleteScheduleUseCase } from "../feature/schedule/usecase/deleteSchedule";
import { createGetScheduleByIdUseCase } from "../feature/schedule/usecase/getScheduleById";
import { createGetSchedulesUseCase } from "../feature/schedule/usecase/getSchedules";
import { createUpdateScheduleUseCase } from "../feature/schedule/usecase/updateSchedule";
import { createUpdateMemoUseCase } from "../feature/supplement/usecase/updateMemo";
import { createCalendarRepo } from "../infra/drizzle/calendarRepo";
import { createScheduleRepo } from "../infra/drizzle/scheduleRepo";
import { createSupplementRepo } from "../infra/drizzle/supplementRepo";
import { createValidationError } from "../shared/errors";
import { getStatusCode } from "../shared/http";
import type { TestDb } from "./helpers";

// テスト用のHonoアプリを作成（userIdはテスト用に固定）
export const createTestApp = (db: TestDb, testUserId = "test-user-id") => {
  const app = new Hono();

  // Drizzleのdbをschedule/supplementリポジトリが期待する形式に変換
  // better-sqlite3のDrizzleインスタンスをD1互換のインターフェースとして使用
  // biome-ignore lint/suspicious/noExplicitAny: TestDb to D1Database compatibility
  const scheduleRepo = createScheduleRepo(db as any);
  // biome-ignore lint/suspicious/noExplicitAny: TestDb to D1Database compatibility
  const supplementRepo = createSupplementRepo(db as any);
  // biome-ignore lint/suspicious/noExplicitAny: TestDb to D1Database compatibility
  const calendarRepo = createCalendarRepo(db as any);

  // ユースケース
  const createSchedule = createCreateScheduleUseCase(scheduleRepo, supplementRepo);
  const getSchedules = createGetSchedulesUseCase(scheduleRepo, calendarRepo);
  const getScheduleById = createGetScheduleByIdUseCase(scheduleRepo, supplementRepo, calendarRepo);
  const updateSchedule = createUpdateScheduleUseCase(scheduleRepo);
  const deleteSchedule = createDeleteScheduleUseCase(scheduleRepo);
  const updateMemo = createUpdateMemoUseCase(supplementRepo, scheduleRepo);

  // ヘルスチェック
  app.get("/health", (c) => c.json({ status: "ok" }));

  // GET /api/schedules
  const getSchedulesQuerySchema = z.object({
    year: z
      .string()
      .optional()
      .transform((v) => (v ? Number.parseInt(v, 10) : undefined)),
    month: z
      .string()
      .optional()
      .transform((v) => (v ? Number.parseInt(v, 10) : undefined)),
  });

  app.get("/api/schedules", zValidator("query", getSchedulesQuerySchema), async (c) => {
    const { year, month } = c.req.valid("query");
    const result = await getSchedules(testUserId, year, month);
    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }
    return c.json(result.value, 200);
  });

  // POST /api/schedules
  app.post(
    "/api/schedules",
    zValidator("json", createScheduleInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const input = c.req.valid("json");
      const result = await createSchedule(input, testUserId);
      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }
      return c.json(result.value, 201);
    }
  );

  // GET /api/schedules/:id
  app.get("/api/schedules/:id", async (c) => {
    const id = c.req.param("id");
    const result = await getScheduleById(id, testUserId);
    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }
    return c.json(result.value, 200);
  });

  // PUT /api/schedules/:id
  app.put(
    "/api/schedules/:id",
    zValidator("json", updateScheduleInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const id = c.req.param("id");
      const input = c.req.valid("json");
      const result = await updateSchedule(id, testUserId, input);
      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }
      return c.json(result.value, 200);
    }
  );

  // DELETE /api/schedules/:id
  app.delete("/api/schedules/:id", async (c) => {
    const id = c.req.param("id");
    const result = await deleteSchedule(id, testUserId);
    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }
    return c.body(null, 204);
  });

  // PUT /api/supplements/:scheduleId/memo
  app.put(
    "/api/supplements/:scheduleId/memo",
    zValidator("json", updateMemoInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const scheduleId = c.req.param("scheduleId");
      const input = c.req.valid("json");
      const result = await updateMemo(scheduleId, input, testUserId);
      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }
      return c.json(result.value, 200);
    }
  );

  return app;
};
