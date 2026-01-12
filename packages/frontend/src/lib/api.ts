/**
 * API クライアント（@ai-scheduler/core からの re-export）
 *
 * 互換性のため、既存の import パスを維持しています。
 * 新規コードでは @ai-scheduler/core/api から直接インポートしてください。
 */
export * from "@ai-scheduler/core/api";
export {
  configureApiClient,
  type ApiClientConfig,
} from "@ai-scheduler/core/api";
