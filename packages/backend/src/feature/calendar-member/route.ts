import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  addMemberInputSchema,
  updateMemberRoleInputSchema,
  transferOwnershipInputSchema,
} from "@ai-scheduler/shared";
import { createDb } from "../../infra/drizzle/client";
import { createCalendarRepo } from "../../infra/drizzle/calendarRepo";
import { createCalendarMemberRepo } from "../../infra/drizzle/calendarMemberRepo";
import { createUserRepo } from "../../infra/drizzle/userRepo";
import { createGetMembersUseCase } from "./usecase/getMembers";
import { createAddMemberUseCase } from "./usecase/addMember";
import { createUpdateMemberRoleUseCase } from "./usecase/updateMemberRole";
import { createRemoveMemberUseCase } from "./usecase/removeMember";
import { createLeaveCalendarUseCase } from "./usecase/leaveCalendar";
import { createTransferOwnershipUseCase } from "./usecase/transferOwnership";
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
  getMembers: ReturnType<typeof createGetMembersUseCase>;
  addMember: ReturnType<typeof createAddMemberUseCase>;
  updateMemberRole: ReturnType<typeof createUpdateMemberRoleUseCase>;
  removeMember: ReturnType<typeof createRemoveMemberUseCase>;
  leaveCalendar: ReturnType<typeof createLeaveCalendarUseCase>;
  transferOwnership: ReturnType<typeof createTransferOwnershipUseCase>;
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

  c.set(
    "getMembers",
    createGetMembersUseCase(calendarRepo, calendarMemberRepo, userRepo)
  );
  c.set(
    "addMember",
    createAddMemberUseCase(calendarRepo, calendarMemberRepo, userRepo)
  );
  c.set(
    "updateMemberRole",
    createUpdateMemberRoleUseCase(calendarRepo, calendarMemberRepo)
  );
  c.set("removeMember", createRemoveMemberUseCase(calendarRepo, calendarMemberRepo));
  c.set("leaveCalendar", createLeaveCalendarUseCase(calendarRepo, calendarMemberRepo));
  c.set(
    "transferOwnership",
    createTransferOwnershipUseCase(calendarRepo, calendarMemberRepo)
  );

  await next();
});

export const calendarMemberRoute = app
  // GET /calendars/:id/members
  .get("/:id/members", async (c) => {
    const calendarId = c.req.param("id");
    const userId = c.get("userId");
    const result = await c.get("getMembers")(calendarId, userId);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json(result.value, 200);
  })
  // POST /calendars/:id/members
  .post(
    "/:id/members",
    zValidator("json", addMemberInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const calendarId = c.req.param("id");
      const userId = c.get("userId");
      const input = c.req.valid("json");
      const result = await c.get("addMember")(calendarId, userId, input);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json(result.value, 201);
    }
  )
  // PUT /calendars/:id/members/:userId
  .put(
    "/:id/members/:targetUserId",
    zValidator("json", updateMemberRoleInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const calendarId = c.req.param("id");
      const targetUserId = c.req.param("targetUserId");
      const operatorId = c.get("userId");
      const input = c.req.valid("json");
      const result = await c.get("updateMemberRole")(
        calendarId,
        targetUserId,
        operatorId,
        input
      );

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.body(null, 204);
    }
  )
  // DELETE /calendars/:id/members/:userId
  .delete("/:id/members/:targetUserId", async (c) => {
    const calendarId = c.req.param("id");
    const targetUserId = c.req.param("targetUserId");
    const operatorId = c.get("userId");
    const result = await c.get("removeMember")(calendarId, targetUserId, operatorId);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.body(null, 204);
  })
  // POST /calendars/:id/leave
  .post("/:id/leave", async (c) => {
    const calendarId = c.req.param("id");
    const userId = c.get("userId");
    const result = await c.get("leaveCalendar")(calendarId, userId);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.body(null, 204);
  })
  // PUT /calendars/:id/transfer
  .put(
    "/:id/transfer",
    zValidator("json", transferOwnershipInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const calendarId = c.req.param("id");
      const currentOwnerId = c.get("userId");
      const input = c.req.valid("json");
      const result = await c.get("transferOwnership")(
        calendarId,
        currentOwnerId,
        input
      );

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.body(null, 204);
    }
  );
