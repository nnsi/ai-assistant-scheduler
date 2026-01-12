/**
 * フロントエンド用構造化ログサービス（@ai-scheduler/core からの re-export）
 *
 * 互換性のため、既存の import パスを維持しています。
 * 新規コードでは @ai-scheduler/core/utils から直接インポートしてください。
 */
import { createLogger, type Logger } from "@ai-scheduler/core/utils";

export type { Logger };

/**
 * Web環境用のロガーインスタンス
 */
export const logger = createLogger(import.meta.env.DEV);
