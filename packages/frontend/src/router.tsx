import {
  createRouter,
  createRootRouteWithContext,
  createRoute,
  redirect,
  Outlet,
} from "@tanstack/react-router";
import { AuthCallback, ReconnectCallback, LoginPage } from "@/components/Auth";
import { InvitationAcceptPage } from "@/components/CalendarSharing";
import { MainApp } from "@/components/MainApp";
import { CalendarDays } from "lucide-react";

// 認証コンテキストの型定義
interface AuthContext {
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ルートルート（レイアウト）
const rootRoute = createRootRouteWithContext<AuthContext>()({
  component: () => <Outlet />,
});

// ローディング画面コンポーネント
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center animate-pulse">
          <CalendarDays className="w-6 h-6 text-white" />
        </div>
        <div className="text-stone-500 text-sm">読み込み中...</div>
      </div>
    </div>
  );
}

// メインページルート（認証必須）
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: ({ context }) => {
    if (context.isLoading) {
      // ローディング中は何もしない（pendingComponentで表示）
      return;
    }
    if (!context.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  pendingComponent: LoadingScreen,
  component: MainApp,
});

// ログインページルート
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: ({ context }) => {
    if (context.isLoading) {
      return;
    }
    // 認証済みならメインページへリダイレクト
    if (context.isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
  pendingComponent: LoadingScreen,
  component: LoginPage,
});

// OAuthコールバックルート
const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/callback",
  component: AuthCallback,
});

// Google再認証コールバックルート
const reconnectCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/reconnect-callback",
  component: ReconnectCallback,
});

// 招待リンク受け入れページルート
const inviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/invite/$token",
  component: InvitationAcceptPage,
});

// ルートツリーの構築
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  authCallbackRoute,
  reconnectCallbackRoute,
  inviteRoute,
]);

// ルーターインスタンスの作成
export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  context: {
    isAuthenticated: false,
    isLoading: true,
  },
});

// 型安全性のためのルーター登録
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
