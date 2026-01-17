import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect, useRef, useState } from "react";

const REDIRECT_URI = `${window.location.origin}/auth/callback`;
const OAUTH_STATE_KEY = "oauth_state";
const ERROR_REDIRECT_SECONDS = 5;

export function AuthCallback() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(ERROR_REDIRECT_SECONDS);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // React Strict Modeでの二重実行を防止
      if (isProcessingRef.current) {
        return;
      }
      isProcessingRef.current = true;

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
        const message = err instanceof Error ? err.message : "ログインに失敗しました";
        setError(message);
      }
    };

    handleCallback();
  }, [login]);

  // エラー時のカウントダウンと自動リダイレクト
  useEffect(() => {
    if (!error) return;

    const intervalId = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          window.location.href = `/?error=${encodeURIComponent(error)}`;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [error]);

  const handleBackToLogin = useCallback(() => {
    window.location.href = error
      ? `/?error=${encodeURIComponent(error)}`
      : "/";
  }, [error]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="text-red-600 mb-4 text-lg">{error}</div>
          <div className="text-gray-500 mb-4">
            {countdown}秒後にログインページにリダイレクトします...
          </div>
          <button
            type="button"
            onClick={handleBackToLogin}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            ログインページに戻る
          </button>
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
