import { Hono } from "hono";
import { scheduleRoute } from "./feature/schedule/route";
import { supplementRoute } from "./feature/supplement/route";
import { aiRoute } from "./feature/ai/route";
import { authRoute } from "./feature/auth/route";
import { profileRoute } from "./feature/profile/route";

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
  .route("/profile", profileRoute);

export type ApiRoutes = typeof apiRoutes;
