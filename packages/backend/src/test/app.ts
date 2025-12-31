import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  createScheduleInputSchema,
  updateScheduleInputSchema,
  updateMemoInputSchema,
} from "@ai-scheduler/shared";
import { createScheduleRepo } from "../infra/drizzle/scheduleRepo";
import { createSupplementRepo } from "../infra/drizzle/supplementRepo";
import { createCreateScheduleUseCase } from "../feature/schedule/usecase/createSchedule";
import { createGetSchedulesUseCase } from "../feature/schedule/usecase/getSchedules";
import { createGetScheduleByIdUseCase } from "../feature/schedule/usecase/getScheduleById";
import { createUpdateScheduleUseCase } from "../feature/schedule/usecase/updateSchedule";
import { createDeleteScheduleUseCase } from "../feature/schedule/usecase/deleteSchedule";
import { createUpdateMemoUseCase } from "../feature/supplement/usecase/updateMemo";
import { createValidationError } from "../shared/errors";
import { getStatusCode } from "../shared/http";
import type { TestDb } from "./helpers";

// テスト用のHonoアプリを作成
export const createTestApp = (db: TestDb) => {
  const app = new Hono();

  // Drizzleのdbをschedule/supplementリポジトリが期待する形式に変換
  // better-sqlite3のDrizzleインスタンスをD1互換のインターフェースとして使用
  const scheduleRepo = createScheduleRepo(db as any);
  const supplementRepo = createSupplementRepo(db as any);

  // ユースケース
  const createSchedule = createCreateScheduleUseCase(scheduleRepo, supplementRepo);
  const getSchedules = createGetSchedulesUseCase(scheduleRepo);
  const getScheduleById = createGetScheduleByIdUseCase(scheduleRepo, supplementRepo);
  const updateSchedule = createUpdateScheduleUseCase(scheduleRepo);
  const deleteSchedule = createDeleteScheduleUseCase(scheduleRepo);
  const updateMemo = createUpdateMemoUseCase(supplementRepo);

  // ヘルスチェック
  app.get("/health", (c) => c.json({ status: "ok" }));

  // GET /api/schedules
  const getSchedulesQuerySchema = z.object({
    year: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
    month: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
  });

  app.get("/api/schedules", zValidator("query", getSchedulesQuerySchema), async (c) => {
    const { year, month } = c.req.valid("query");
    const result = await getSchedules(year, month);
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
      const result = await createSchedule(input);
      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }
      return c.json(result.value, 201);
    }
  );

  // GET /api/schedules/:id
  app.get("/api/schedules/:id", async (c) => {
    const id = c.req.param("id");
    const result = await getScheduleById(id);
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
      const result = await updateSchedule(id, input);
      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }
      return c.json(result.value, 200);
    }
  );

  // DELETE /api/schedules/:id
  app.delete("/api/schedules/:id", async (c) => {
    const id = c.req.param("id");
    const result = await deleteSchedule(id);
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
      const result = await updateMemo(scheduleId, input);
      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }
      return c.json(result.value, 200);
    }
  );

  return app;
};
