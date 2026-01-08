import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  createCalendarInputSchema,
  updateCalendarInputSchema,
} from "@ai-scheduler/shared";
import { createDb } from "../../infra/drizzle/client";
import { createCalendarRepo } from "../../infra/drizzle/calendarRepo";
import { createCalendarMemberRepo } from "../../infra/drizzle/calendarMemberRepo";
import { createUserRepo } from "../../infra/drizzle/userRepo";
import { createCreateCalendarUseCase } from "./usecase/createCalendar";
import { createGetCalendarsUseCase } from "./usecase/getCalendars";
import { createGetCalendarDetailUseCase } from "./usecase/getCalendarDetail";
import { createUpdateCalendarUseCase } from "./usecase/updateCalendar";
import { createDeleteCalendarUseCase } from "./usecase/deleteCalendar";
import { createValidationError } from "../../shared/errors";
import { getStatusCode } from "../../shared/http";
import { authMiddleware } from "../../middleware/auth";

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

type Variables = {
  userId: string;
  userEmail: string;
  createCalendar: ReturnType<typeof createCreateCalendarUseCase>;
  getCalendars: ReturnType<typeof createGetCalendarsUseCase>;
  getCalendarDetail: ReturnType<typeof createGetCalendarDetailUseCase>;
  updateCalendar: ReturnType<typeof createUpdateCalendarUseCase>;
  deleteCalendar: ReturnType<typeof createDeleteCalendarUseCase>;
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
  const calendarRepo = createCalendarRepo(db);
  const calendarMemberRepo = createCalendarMemberRepo(db);
  const userRepo = createUserRepo(db);

  c.set("createCalendar", createCreateCalendarUseCase(calendarRepo, userRepo));
  c.set(
    "getCalendars",
    createGetCalendarsUseCase(calendarRepo, calendarMemberRepo, userRepo)
  );
  c.set(
    "getCalendarDetail",
    createGetCalendarDetailUseCase(calendarRepo, calendarMemberRepo, userRepo)
  );
  c.set(
    "updateCalendar",
    createUpdateCalendarUseCase(calendarRepo, calendarMemberRepo, userRepo)
  );
  c.set("deleteCalendar", createDeleteCalendarUseCase(calendarRepo));

  await next();
});

export const calendarRoute = app
  // GET /calendars
  .get("/", async (c) => {
    const userId = c.get("userId");
    const result = await c.get("getCalendars")(userId);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json(result.value, 200);
  })
  // POST /calendars
  .post(
    "/",
    zValidator("json", createCalendarInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const input = c.req.valid("json");
      const userId = c.get("userId");
      const result = await c.get("createCalendar")(input, userId);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json(result.value, 201);
    }
  )
  // GET /calendars/:id
  .get("/:id", async (c) => {
    const calendarId = c.req.param("id");
    const userId = c.get("userId");
    const result = await c.get("getCalendarDetail")(calendarId, userId);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json(result.value, 200);
  })
  // PUT /calendars/:id
  .put(
    "/:id",
    zValidator("json", updateCalendarInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const calendarId = c.req.param("id");
      const userId = c.get("userId");
      const input = c.req.valid("json");
      const result = await c.get("updateCalendar")(calendarId, userId, input);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json(result.value, 200);
    }
  )
  // DELETE /calendars/:id
  .delete("/:id", async (c) => {
    const calendarId = c.req.param("id");
    const userId = c.get("userId");
    const result = await c.get("deleteCalendar")(calendarId, userId);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.body(null, 204);
  });
