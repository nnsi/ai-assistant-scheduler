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
const log = (level: LogLevel, message: string, context?: LogContext, error?: unknown, isDev?: boolean): void => {
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
 * ロガーファクトリー関数
 * 環境に応じたロガーを生成する
 *
 * @param isDev - 開発環境かどうか
 * @returns ロガーオブジェクト
 *
 * @example
 * // Web環境での使用
 * const logger = createLogger(import.meta.env.DEV);
 *
 * // React Native環境での使用
 * const logger = createLogger(__DEV__);
 */
export const createLogger = (isDev: boolean) => ({
  debug: (message: string, context?: LogContext): void => {
    if (isDev) {
      log("debug", message, context, undefined, isDev);
    }
  },

  info: (message: string, context?: LogContext): void => {
    log("info", message, context, undefined, isDev);
  },

  warn: (message: string, context?: LogContext, error?: unknown): void => {
    log("warn", message, context, error, isDev);
  },

  error: (message: string, context?: LogContext, error?: unknown): void => {
    log("error", message, context, error, isDev);
  },
});

/**
 * ロガーの型
 */
export type Logger = ReturnType<typeof createLogger>;
