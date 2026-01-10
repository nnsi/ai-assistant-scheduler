import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { apiRoutes } from "./route";
import { AppException, createInternalError } from "./shared/errors";
import { getStatusCode } from "./shared/http";

type Bindings = {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
  FRONTEND_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// グローバルエラーハンドラ
app.onError((err, c) => {
  // AppExceptionの場合は適切なステータスコードでレスポンス
  if (err instanceof AppException) {
    const apiError = err.toApiError();
    return c.json(apiError, getStatusCode(apiError.code));
  }

  // その他のエラーは500 Internal Server Error
  console.error("Unhandled error:", err);
  const internalError = createInternalError(
    err instanceof Error ? err.message : "Unknown error"
  );
  return c.json(internalError, 500);
});

// 開発環境で許可するlocalhostポート
const ALLOWED_DEV_PORTS = [5173, 3000, 6006];

// セキュリティヘッダーの設定
app.use(
  "*",
  secureHeaders({
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    strictTransportSecurity: "max-age=31536000; includeSubDomains",
    referrerPolicy: "strict-origin-when-cross-origin",
  })
);

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
      // 開発環境では許可されたlocalhostポートのみ許可
      if (origin.startsWith("http://localhost:")) {
        const portMatch = origin.match(/:(\d+)$/);
        if (portMatch) {
          const port = parseInt(portMatch[1], 10);
          if (ALLOWED_DEV_PORTS.includes(port)) {
            return origin;
          }
        }
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
