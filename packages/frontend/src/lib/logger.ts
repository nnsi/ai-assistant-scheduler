/**
 * フロントエンド用構造化ログサービス
 *
 * 開発環境ではコンソールに出力し、本番環境では
 * エラートラッキングサービス（Sentry等）に統合可能。
 */

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = {
  /** エラーの種類（例: "auth", "api", "ui"） */
  category?: string;
  /** 追加のメタデータ */
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
  };
};

const isDev = import.meta.env.DEV;

/**
 * エラーオブジェクトをシリアライズ
 */
const serializeError = (error: unknown): LogEntry["error"] | undefined => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
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

  // 開発環境では読みやすい形式で出力
  if (isDev) {
    const prefix = `[${level.toUpperCase()}]`;
    if (error) {
      console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
        prefix,
        message,
        context || {},
        error
      );
    } else {
      console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
        prefix,
        message,
        context || {}
      );
    }
  } else {
    // 本番環境では構造化ログを出力
    // 将来的にはSentry等に送信
    if (level === "error" || level === "warn") {
      console[level](JSON.stringify(entry));
    }
  }
};

/**
 * フロントエンド用ログサービス
 *
 * @example
 * // 基本的なエラーログ
 * logger.error("Failed to fetch data", { category: "api" });
 *
 * // エラーオブジェクト付き
 * try {
 *   await fetchData();
 * } catch (error) {
 *   logger.error("Failed to fetch data", { category: "api" }, error);
 * }
 */
export const logger = {
  debug: (message: string, context?: LogContext): void => {
    if (isDev) {
      log("debug", message, context);
    }
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
