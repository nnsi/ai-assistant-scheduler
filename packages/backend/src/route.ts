import { Hono } from "hono";
import { scheduleRoute } from "./feature/schedule/route";
import { supplementRoute } from "./feature/supplement/route";
import { aiRoute } from "./feature/ai/route";

type Bindings = {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
};

export const apiRoutes = new Hono<{ Bindings: Bindings }>();

// 各featureのルートを集約
apiRoutes.route("/schedules", scheduleRoute);
apiRoutes.route("/supplements", supplementRoute);
apiRoutes.route("/ai", aiRoute);
