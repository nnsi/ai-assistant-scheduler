import { Hono } from "hono";
import { createDb } from "../../infra/drizzle/client";
import { createScheduleRepo } from "../../infra/drizzle/scheduleRepo";
import { createSupplementRepo } from "../../infra/drizzle/supplementRepo";
import { createCreateScheduleUseCase } from "./usecase/createSchedule";
import { createGetSchedulesUseCase } from "./usecase/getSchedules";
import { createGetScheduleByIdUseCase } from "./usecase/getScheduleById";
import { createUpdateScheduleUseCase } from "./usecase/updateSchedule";
import { createDeleteScheduleUseCase } from "./usecase/deleteSchedule";
import { createCreateScheduleHandler } from "./handler/createScheduleHandler";
import { createGetSchedulesHandler } from "./handler/getSchedulesHandler";
import { createGetScheduleByIdHandler } from "./handler/getScheduleByIdHandler";
import { createUpdateScheduleHandler } from "./handler/updateScheduleHandler";
import { createDeleteScheduleHandler } from "./handler/deleteScheduleHandler";

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

export const scheduleRoute = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// ミドルウェアでDIを解決
scheduleRoute.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  const scheduleRepo = createScheduleRepo(db);
  const supplementRepo = createSupplementRepo(db);

  c.set("createSchedule", createCreateScheduleUseCase(scheduleRepo));
  c.set("getSchedules", createGetSchedulesUseCase(scheduleRepo));
  c.set("getScheduleById", createGetScheduleByIdUseCase(scheduleRepo, supplementRepo));
  c.set("updateSchedule", createUpdateScheduleUseCase(scheduleRepo));
  c.set("deleteSchedule", createDeleteScheduleUseCase(scheduleRepo));

  await next();
});

// GET /schedules
scheduleRoute.get("/", async (c) => {
  const handler = createGetSchedulesHandler(c.get("getSchedules"));
  return handler(c);
});

// POST /schedules
scheduleRoute.post("/", async (c) => {
  const handler = createCreateScheduleHandler(c.get("createSchedule"));
  return handler(c);
});

// GET /schedules/:id
scheduleRoute.get("/:id", async (c) => {
  const handler = createGetScheduleByIdHandler(c.get("getScheduleById"));
  return handler(c);
});

// PUT /schedules/:id
scheduleRoute.put("/:id", async (c) => {
  const handler = createUpdateScheduleHandler(c.get("updateSchedule"));
  return handler(c);
});

// DELETE /schedules/:id
scheduleRoute.delete("/:id", async (c) => {
  const handler = createDeleteScheduleHandler(c.get("deleteSchedule"));
  return handler(c);
});
