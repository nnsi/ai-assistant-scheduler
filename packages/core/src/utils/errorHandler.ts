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
 * ApiClientErrorかどうかを判定する
 */
export function isApiClientError(
  error: unknown
): error is { name: "ApiClientError"; code: AppErrorCode; message: string; details?: unknown } {
  return (
    error instanceof Error &&
    error.name === "ApiClientError" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}

/**
 * エラーコードに対応するユーザー向けメッセージを取得
 *
 * 各メッセージには「何が起きたか」と「次に何をすべきか」を含める
 */
function getMessageForCode(code: AppErrorCode): string {
  switch (code) {
    case "NETWORK_ERROR":
      return "ネットワークに接続できませんでした。インターネット接続を確認して、再度お試しください。";
    case "AUTH_ERROR":
      return "ログインの有効期限が切れました。お手数ですが、再度ログインしてください。";
    case "NOT_FOUND":
      return "お探しのデータが見つかりませんでした。削除された可能性があります。一覧画面に戻って確認してください。";
    case "SERVER_ERROR":
      return "サーバーで問題が発生しました。しばらく時間をおいてから再度お試しください。問題が続く場合はサポートにお問い合わせください。";
    case "VALIDATION_ERROR":
      return "入力内容に誤りがあります。赤く表示されている項目を確認して、修正してください。";
    default:
      return "予期しないエラーが発生しました。ページを再読み込みするか、しばらく時間をおいてから再度お試しください。";
  }
}

/**
 * 任意のエラーをAppError形式に変換する
 */
export function toAppError(error: unknown): AppError {
  // すでにAppError形式の場合
  if (isAppError(error)) {
    return error;
  }

  // ApiClientErrorの場合（構造化されたエラー情報を直接利用）
  if (isApiClientError(error)) {
    return {
      code: error.code,
      message: error.message || getMessageForCode(error.code),
      originalError: error,
    };
  }

  // Errorオブジェクトの場合
  if (error instanceof Error) {
    // ネットワークエラーの判定
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return {
        code: "NETWORK_ERROR",
        message: getMessageForCode("NETWORK_ERROR"),
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
