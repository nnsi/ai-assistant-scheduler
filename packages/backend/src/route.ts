import { Hono } from "hono";
import { scheduleRoute } from "./feature/schedule/route";
import { supplementRoute } from "./feature/supplement/route";
import { aiRoute } from "./feature/ai/route";

type Bindings = {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// 各featureのルートを集約
export const apiRoutes = app
  .route("/schedules", scheduleRoute)
  .route("/supplements", supplementRoute)
  .route("/ai", aiRoute);

export type ApiRoutes = typeof apiRoutes;
