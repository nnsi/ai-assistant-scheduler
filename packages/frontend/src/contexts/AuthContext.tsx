/**
 * 認証コンテキスト（Web環境用ラッパー）
 *
 * @ai-scheduler/core の AuthProvider に Web 環境固有の設定を注入します。
 */
import { type ReactNode } from "react";
import {
  AuthProvider as CoreAuthProvider,
  useAuth,
  type AuthProviderConfig,
} from "@ai-scheduler/core/contexts";
import { configureApiClient } from "@ai-scheduler/core/api";
import { storage } from "../storage";
import { logger } from "../lib/logger";

// 環境変数
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// API クライアントを設定
configureApiClient({
  baseUrl: API_BASE_URL,
  useCredentials: true,
});

// Web 環境用の設定
const authConfig: AuthProviderConfig = {
  apiBaseUrl: API_BASE_URL,
  storage,
  logger,
  useCredentials: true,
};

/**
 * Web 環境用の AuthProvider
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <CoreAuthProvider config={authConfig}>
      {children}
    </CoreAuthProvider>
  );
}

export { useAuth };
