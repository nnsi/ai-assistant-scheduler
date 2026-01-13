/**
 * アプリプロバイダー
 * 認証、カレンダー、クエリクライアントなどを提供
 */
import { type ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  AuthProvider,
  CalendarProvider,
  createLogger,
  configureApiClient,
} from "@ai-scheduler/core";
import { storage, initializeStorage } from "../storage";
import { config } from "./config";

// ロガー作成
const logger = createLogger(__DEV__);

// QueryClient設定
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分
      retry: 1,
      refetchOnWindowFocus: false, // RNでは不要
    },
    mutations: {
      retry: 1,
    },
  },
});

// API初期化
configureApiClient({
  baseUrl: config.apiBaseUrl,
  // RNではCookieを使わない
  useCredentials: false,
});

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * アプリケーション全体のプロバイダー
 */
export function AppProviders({ children }: AppProvidersProps) {
  const [isStorageReady, setIsStorageReady] = useState(false);

  // ストレージを初期化
  useEffect(() => {
    initializeStorage().then(() => {
      setIsStorageReady(true);
    });
  }, []);

  // ストレージ初期化完了まで待機
  if (!isStorageReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider
        config={{
          apiBaseUrl: config.apiBaseUrl,
          storage,
          logger,
          useCredentials: false, // RNではCookieを使わない
        }}
      >
        <CalendarProvider config={{ storage }}>
          {children}
        </CalendarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export { queryClient, logger };
