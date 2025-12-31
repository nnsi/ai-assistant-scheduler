import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  createScheduleInputSchema,
  updateScheduleInputSchema,
} from "@ai-scheduler/shared";
import { createDb } from "../../infra/drizzle/client";
import { createScheduleRepo } from "../../infra/drizzle/scheduleRepo";
import { createSupplementRepo } from "../../infra/drizzle/supplementRepo";
import { createCreateScheduleUseCase } from "./usecase/createSchedule";
import { createGetSchedulesUseCase } from "./usecase/getSchedules";
import { createGetScheduleByIdUseCase } from "./usecase/getScheduleById";
import { createUpdateScheduleUseCase } from "./usecase/updateSchedule";
import { createDeleteScheduleUseCase } from "./usecase/deleteSchedule";
import { createValidationError } from "../../shared/errors";
import { getStatusCode } from "../../shared/http";

type Bindings = {
  DB: D1Database;
};

type Variables = {
  createSchedule: ReturnType<typeof createCreateScheduleUseCase>;
  getSchedules: ReturnType<typeof createGetSchedulesUseCase>;
  getScheduleById: ReturnType<typeof createGetScheduleByIdUseCase>;
  updateSchedule: ReturnType<typeof createUpdateScheduleUseCase>;
  deleteSchedule: ReturnType<typeof createDeleteScheduleUseCase>;
};

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// ミドルウェアでDIを解決
app.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  const scheduleRepo = createScheduleRepo(db);
  const supplementRepo = createSupplementRepo(db);

  c.set("createSchedule", createCreateScheduleUseCase(scheduleRepo, supplementRepo));
  c.set("getSchedules", createGetSchedulesUseCase(scheduleRepo));
  c.set(
    "getScheduleById",
    createGetScheduleByIdUseCase(scheduleRepo, supplementRepo)
  );
  c.set("updateSchedule", createUpdateScheduleUseCase(scheduleRepo));
  c.set("deleteSchedule", createDeleteScheduleUseCase(scheduleRepo));

  await next();
});

const getSchedulesQuerySchema = z.object({
  year: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
  month: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
});

export const scheduleRoute = app
  // GET /schedules
  .get("/", zValidator("query", getSchedulesQuerySchema), async (c) => {
    const { year, month } = c.req.valid("query");
    const result = await c.get("getSchedules")(year, month);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json(result.value, 200);
  })
  // POST /schedules
  .post(
    "/",
    zValidator("json", createScheduleInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const input = c.req.valid("json");
      const result = await c.get("createSchedule")(input);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json(result.value, 201);
    }
  )
  // GET /schedules/:id
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const result = await c.get("getScheduleById")(id);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json(result.value, 200);
  })
  // PUT /schedules/:id
  .put(
    "/:id",
    zValidator("json", updateScheduleInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const id = c.req.param("id");
      const input = c.req.valid("json");
      const result = await c.get("updateSchedule")(id, input);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json(result.value, 200);
    }
  )
  // DELETE /schedules/:id
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const result = await c.get("deleteSchedule")(id);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.body(null, 204);
  });
