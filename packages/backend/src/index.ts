import { Hono } from "hono";
import { cors } from "hono/cors";
import { apiRoutes } from "./route";

type Bindings = {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
  FRONTEND_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS設定
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const frontendUrl = c.env.FRONTEND_URL || "http://localhost:5173";
      // 許可されたoriginのみを返す。マッチしない場合はnullを返して拒否
      if (!origin || origin === frontendUrl) {
        return frontendUrl;
      }
      // 開発環境では localhost を許可
      if (origin.startsWith("http://localhost:")) {
        return origin;
      }
      return null;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ヘルスチェック
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// APIルート
app.route("/api", apiRoutes);

export default app;
