/**
 * エラーハンドリング（@ai-scheduler/core からの re-export）
 *
 * 互換性のため、既存の import パスを維持しています。
 * 新規コードでは @ai-scheduler/core/utils から直接インポートしてください。
 */
export {
  toAppError,
  isAppError,
  toError,
  getErrorMessage,
  logError,
  type AppErrorCode,
  type AppError,
} from "@ai-scheduler/core/utils";

// 後方互換性のため、開発環境判定付きの logError をデフォルトエクスポート
import { logError as coreLogError } from "@ai-scheduler/core/utils";

/**
 * コンソールにエラーをログ出力する（開発時のデバッグ用）
 * Web環境用のラッパー
 */
export function logErrorWithDev(context: string, error: unknown): void {
  coreLogError(context, error, import.meta.env.DEV);
}
