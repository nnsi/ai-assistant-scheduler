import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createInvitationInputSchema } from "@ai-scheduler/shared";
import { createDb } from "../../infra/drizzle/client";
import { createCalendarRepo } from "../../infra/drizzle/calendarRepo";
import { createCalendarMemberRepo } from "../../infra/drizzle/calendarMemberRepo";
import { createCalendarInvitationRepo } from "../../infra/drizzle/calendarInvitationRepo";
import { createUserRepo } from "../../infra/drizzle/userRepo";
import { createCreateInvitationUseCase } from "./usecase/createInvitation";
import { createGetInvitationsUseCase } from "./usecase/getInvitations";
import { createRevokeInvitationUseCase } from "./usecase/revokeInvitation";
import { createGetInvitationInfoUseCase } from "./usecase/getInvitationInfo";
import { createAcceptInvitationUseCase } from "./usecase/acceptInvitation";
import { createValidationError } from "../../shared/errors";
import { getStatusCode } from "../../shared/http";
import { authMiddleware } from "../../middleware/auth";

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  FRONTEND_URL?: string;
};

type Variables = {
  userId: string;
  userEmail: string;
  createInvitation: ReturnType<typeof createCreateInvitationUseCase>;
  getInvitations: ReturnType<typeof createGetInvitationsUseCase>;
  revokeInvitation: ReturnType<typeof createRevokeInvitationUseCase>;
  getInvitationInfo: ReturnType<typeof createGetInvitationInfoUseCase>;
  acceptInvitation: ReturnType<typeof createAcceptInvitationUseCase>;
};

// カレンダー関連の招待ルート（認証必須）
const calendarInvitationRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

calendarInvitationRoutes.use("*", authMiddleware);

calendarInvitationRoutes.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  const calendarRepo = createCalendarRepo(db);
  const calendarMemberRepo = createCalendarMemberRepo(db);
  const calendarInvitationRepo = createCalendarInvitationRepo(db);

  const getBaseUrl = () => c.env.FRONTEND_URL ?? "http://localhost:5173";

  c.set(
    "createInvitation",
    createCreateInvitationUseCase(
      calendarRepo,
      calendarMemberRepo,
      calendarInvitationRepo,
      getBaseUrl
    )
  );
  c.set(
    "getInvitations",
    createGetInvitationsUseCase(calendarRepo, calendarMemberRepo, calendarInvitationRepo)
  );
  c.set(
    "revokeInvitation",
    createRevokeInvitationUseCase(calendarRepo, calendarMemberRepo, calendarInvitationRepo)
  );

  await next();
});

export const calendarInvitationRoute = calendarInvitationRoutes
  // POST /calendars/:id/invitations
  .post(
    "/:id/invitations",
    zValidator("json", createInvitationInputSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const calendarId = c.req.param("id");
      const userId = c.get("userId");
      const input = c.req.valid("json");
      const result = await c.get("createInvitation")(calendarId, userId, input);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json(result.value, 201);
    }
  )
  // GET /calendars/:id/invitations
  .get("/:id/invitations", async (c) => {
    const calendarId = c.req.param("id");
    const userId = c.get("userId");
    const result = await c.get("getInvitations")(calendarId, userId);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json(result.value, 200);
  })
  // DELETE /calendars/:id/invitations/:invitationId
  .delete("/:id/invitations/:invitationId", async (c) => {
    const calendarId = c.req.param("id");
    const invitationId = c.req.param("invitationId");
    const userId = c.get("userId");
    const result = await c.get("revokeInvitation")(calendarId, invitationId, userId);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.body(null, 204);
  });

// 招待トークン関連のルート（一部認証不要）
const invitationTokenRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// GET /invitations/:token は認証不要
invitationTokenRoutes.get("/:token", async (c) => {
  const db = createDb(c.env.DB);
  const calendarRepo = createCalendarRepo(db);
  const calendarInvitationRepo = createCalendarInvitationRepo(db);
  const userRepo = createUserRepo(db);

  const getInvitationInfo = createGetInvitationInfoUseCase(
    calendarRepo,
    calendarInvitationRepo,
    userRepo
  );

  const token = c.req.param("token");
  const result = await getInvitationInfo(token);

  if (!result.ok) {
    return c.json(result.error, getStatusCode(result.error.code));
  }

  return c.json(result.value, 200);
});

// POST /invitations/:token/accept は認証必須
invitationTokenRoutes.post("/:token/accept", authMiddleware, async (c) => {
  const db = createDb(c.env.DB);
  const calendarRepo = createCalendarRepo(db);
  const calendarMemberRepo = createCalendarMemberRepo(db);
  const calendarInvitationRepo = createCalendarInvitationRepo(db);

  const acceptInvitation = createAcceptInvitationUseCase(
    calendarRepo,
    calendarMemberRepo,
    calendarInvitationRepo
  );

  const token = c.req.param("token");
  const userId = c.get("userId");
  const result = await acceptInvitation(token, userId);

  if (!result.ok) {
    return c.json(result.error, getStatusCode(result.error.code));
  }

  return c.json(result.value, 200);
});

export const invitationRoute = invitationTokenRoutes;
