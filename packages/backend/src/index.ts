import { Hono } from "hono";
import { cors } from "hono/cors";
import { apiRoutes } from "./route";

type Bindings = {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
  FRONTEND_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS設定
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const frontendUrl = c.env.FRONTEND_URL || "http://localhost:5173";
      return origin === frontendUrl ? origin : frontendUrl;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

// ヘルスチェック
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// APIルート
app.route("/api", apiRoutes);

export default app;
