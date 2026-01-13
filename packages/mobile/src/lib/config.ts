/**
 * アプリ設定
 */
import Constants from "expo-constants";

// 環境変数から取得、開発環境用のデフォルト値
const extra = Constants.expoConfig?.extra ?? {};

export const config = {
  /** API ベース URL */
  apiBaseUrl: extra.apiBaseUrl ?? "http://localhost:8787/api",

  /** Google OAuth Client ID (iOS) */
  googleIosClientId: extra.googleIosClientId ?? "",

  /** Google OAuth Client ID (Android) */
  googleAndroidClientId: extra.googleAndroidClientId ?? "",

  /** Google OAuth Client ID (Web - Expo Go用) */
  googleWebClientId: extra.googleWebClientId ?? "",

  /** 開発モードかどうか */
  isDevelopment: __DEV__,
} as const;

export default config;
