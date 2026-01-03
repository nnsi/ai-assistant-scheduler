import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const REDIRECT_URI = `${window.location.origin}/auth/callback`;
const OAUTH_STATE_KEY = "oauth_state";

export function AuthCallback() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const errorParam = params.get("error");
      const returnedState = params.get("state");

      if (errorParam) {
        // エラーがある場合はログインページにリダイレクト
        sessionStorage.removeItem(OAUTH_STATE_KEY);
        window.location.href = `/?error=${encodeURIComponent(errorParam)}`;
        return;
      }

      // CSRF対策: stateパラメータの検証
      const savedState = sessionStorage.getItem(OAUTH_STATE_KEY);
      sessionStorage.removeItem(OAUTH_STATE_KEY);

      if (!returnedState || returnedState !== savedState) {
        window.location.href = "/?error=不正なリクエストです";
        return;
      }

      if (!code) {
        window.location.href = "/?error=認証コードがありません";
        return;
      }

      try {
        await login(code, REDIRECT_URI);
        // ログイン成功後、メインページにリダイレクト
        window.location.href = "/";
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "ログインに失敗しました";
        setError(message);
        // 3秒後にログインページにリダイレクト
        setTimeout(() => {
          window.location.href = `/?error=${encodeURIComponent(message)}`;
        }, 3000);
      }
    };

    handleCallback();
  }, [login]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <div className="text-gray-500">ログインページにリダイレクトします...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <div className="text-gray-600">ログイン処理中...</div>
      </div>
    </div>
  );
}
