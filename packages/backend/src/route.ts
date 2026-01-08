import { Hono } from "hono";
import { scheduleRoute } from "./feature/schedule/route";
import { supplementRoute } from "./feature/supplement/route";
import { aiRoute } from "./feature/ai/route";
import { authRoute } from "./feature/auth/route";
import { profileRoute } from "./feature/profile/route";
import { categoryRoute } from "./feature/category/route";
import { recurrenceRoute } from "./feature/recurrence/route";
import { calendarRoute } from "./feature/calendar/route";
import { calendarMemberRoute } from "./feature/calendar-member/route";
import { calendarInvitationRoute, invitationRoute } from "./feature/invitation/route";

type Bindings = {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// 各featureのルートを集約
export const apiRoutes = app
  .route("/auth", authRoute)
  .route("/schedules", scheduleRoute)
  .route("/supplements", supplementRoute)
  .route("/ai", aiRoute)
  .route("/profile", profileRoute)
  .route("/categories", categoryRoute)
  .route("/recurrence", recurrenceRoute)
  .route("/calendars", calendarRoute)
  .route("/calendars", calendarMemberRoute)
  .route("/calendars", calendarInvitationRoute)
  .route("/invitations", invitationRoute);

export type ApiRoutes = typeof apiRoutes;
