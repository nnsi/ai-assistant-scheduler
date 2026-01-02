/**
 * 構造化ログサービス
 *
 * Cloudflare Workers 環境での本番ログ出力用。
 * 将来的にはSentry、Datadog、CloudflareのLogpushなどに統合可能。
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = {
  /** エラーの種類（例: "oauth", "ai", "database"） */
  category?: string;
  /** ユーザーID（認証済みの場合） */
  userId?: string;
  /** リクエストID（トレーシング用） */
  requestId?: string;
  /** その他のメタデータ */
  [key: string]: unknown;
};

type LogEntry = {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
};

/**
 * ログエントリを構造化JSON形式で出力
 */
const formatLog = (entry: LogEntry): string => {
  return JSON.stringify(entry);
};

/**
 * エラーオブジェクトをシリアライズ可能な形式に変換
 */
const serializeError = (error: unknown): LogEntry["error"] | undefined => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  if (typeof error === "string") {
    return {
      name: "Error",
      message: error,
    };
  }
  if (error !== null && error !== undefined) {
    return {
      name: "UnknownError",
      message: String(error),
    };
  }
  return undefined;
};

/**
 * ログ出力
 */
const log = (level: LogLevel, message: string, context?: LogContext, error?: unknown): void => {
  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    error: serializeError(error),
  };

  const formatted = formatLog(entry);

  // Cloudflare Workers では console.log が Workers Logs に出力される
  switch (level) {
    case "debug":
      console.debug(formatted);
      break;
    case "info":
      console.info(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }
};

/**
 * 構造化ログサービス
 *
 * @example
 * // 基本的なエラーログ
 * logger.error("Failed to fetch user", { category: "database", userId: "123" });
 *
 * // エラーオブジェクト付き
 * try {
 *   await fetchUser();
 * } catch (error) {
 *   logger.error("Failed to fetch user", { category: "database" }, error);
 * }
 */
export const logger = {
  debug: (message: string, context?: LogContext): void => {
    log("debug", message, context);
  },

  info: (message: string, context?: LogContext): void => {
    log("info", message, context);
  },

  warn: (message: string, context?: LogContext, error?: unknown): void => {
    log("warn", message, context, error);
  },

  error: (message: string, context?: LogContext, error?: unknown): void => {
    log("error", message, context, error);
  },
};
