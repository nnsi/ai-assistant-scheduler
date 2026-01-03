import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { OAUTH_RECONNECT_STATE_KEY } from "./ProfileSettingsModal";

const REDIRECT_URI = `${window.location.origin}/auth/reconnect-callback`;

export function ReconnectCallback() {
  const { reconnectGoogle, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // 認証されていない場合はログインページにリダイレクト
      if (!isAuthenticated) {
        window.location.href = "/?error=認証が必要です";
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const returnedState = params.get("state");
      const errorParam = params.get("error");

      if (errorParam) {
        window.location.href = `/?error=${encodeURIComponent(errorParam)}`;
        return;
      }

      // CSRF対策: stateパラメータの検証
      const savedState = sessionStorage.getItem(OAUTH_RECONNECT_STATE_KEY);
      sessionStorage.removeItem(OAUTH_RECONNECT_STATE_KEY);

      if (!returnedState || returnedState !== savedState) {
        window.location.href = "/?error=不正なリクエストです";
        return;
      }

      if (!code) {
        window.location.href = "/?error=認証コードがありません";
        return;
      }

      try {
        await reconnectGoogle(code, REDIRECT_URI);
        // 成功後、メインページにリダイレクト
        window.location.href = "/?success=Googleアカウントを再設定しました";
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Googleアカウントの再設定に失敗しました";
        setError(message);
        // 3秒後にメインページにリダイレクト
        setTimeout(() => {
          window.location.href = `/?error=${encodeURIComponent(message)}`;
        }, 3000);
      }
    };

    handleCallback();
  }, [reconnectGoogle, isAuthenticated]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <div className="text-gray-500">メインページにリダイレクトします...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <div className="text-gray-600">Googleアカウント再設定中...</div>
      </div>
    </div>
  );
}
