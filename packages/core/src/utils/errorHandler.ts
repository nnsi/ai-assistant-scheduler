/**
 * フロントエンド共通エラーハンドリング
 */

export type AppErrorCode =
  | "NETWORK_ERROR"
  | "AUTH_ERROR"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "SERVER_ERROR"
  | "UNKNOWN_ERROR";

export type AppError = {
  code: AppErrorCode;
  message: string;
  originalError?: unknown;
};

/**
 * 任意のエラーをAppError形式に変換する
 */
export function toAppError(error: unknown): AppError {
  // すでにAppError形式の場合
  if (isAppError(error)) {
    return error;
  }

  // Errorオブジェクトの場合
  if (error instanceof Error) {
    // ネットワークエラーの判定
    if (
      error.name === "TypeError" &&
      error.message.includes("fetch")
    ) {
      return {
        code: "NETWORK_ERROR",
        message: "ネットワークエラーが発生しました。接続を確認してください。",
        originalError: error,
      };
    }

    // 認証エラーの判定
    if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      return {
        code: "AUTH_ERROR",
        message: "認証エラーが発生しました。再度ログインしてください。",
        originalError: error,
      };
    }

    // 404エラーの判定
    if (error.message.includes("404") || error.message.includes("Not Found")) {
      return {
        code: "NOT_FOUND",
        message: "リソースが見つかりませんでした。",
        originalError: error,
      };
    }

    // 500系エラーの判定
    if (error.message.includes("500") || error.message.includes("Server Error")) {
      return {
        code: "SERVER_ERROR",
        message: "サーバーエラーが発生しました。しばらく待ってから再試行してください。",
        originalError: error,
      };
    }

    // その他のErrorオブジェクト
    return {
      code: "UNKNOWN_ERROR",
      message: error.message,
      originalError: error,
    };
  }

  // 文字列の場合
  if (typeof error === "string") {
    return {
      code: "UNKNOWN_ERROR",
      message: error,
      originalError: error,
    };
  }

  // その他
  return {
    code: "UNKNOWN_ERROR",
    message: "予期しないエラーが発生しました。",
    originalError: error,
  };
}

/**
 * AppError形式かどうかを判定する
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    typeof (error as AppError).code === "string" &&
    typeof (error as AppError).message === "string"
  );
}

/**
 * エラーからError型を取得する（従来との互換性用）
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === "string") {
    return new Error(error);
  }
  return new Error(String(error));
}

/**
 * エラーメッセージを取得する
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "予期しないエラーが発生しました。";
}

/**
 * コンソールにエラーをログ出力する（開発時のデバッグ用）
 * @param isDev - 開発環境かどうか（環境から注入）
 */
export function logError(context: string, error: unknown, isDev = false): void {
  if (isDev) {
    console.error(`[${context}]`, error);
  }
}
