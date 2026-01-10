import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CalendarProvider } from "./contexts/CalendarContext";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分間はキャッシュを使用
      retry: 1,
    },
  },
});

// ルーターに認証コンテキストを提供するラッパー
function InnerApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const prevAuthRef = useRef({ isAuthenticated, isLoading });

  // 認証状態が変化したらルーターを再評価
  useEffect(() => {
    const prev = prevAuthRef.current;
    // isLoadingがfalseになった時、または認証状態が変化した時にルーターを再評価
    if (
      (prev.isLoading && !isLoading) ||
      prev.isAuthenticated !== isAuthenticated
    ) {
      router.invalidate();
    }
    prevAuthRef.current = { isAuthenticated, isLoading };
  }, [isAuthenticated, isLoading]);

  return (
    <RouterProvider
      router={router}
      context={{ isAuthenticated, isLoading }}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CalendarProvider>
          <InnerApp />
        </CalendarProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
