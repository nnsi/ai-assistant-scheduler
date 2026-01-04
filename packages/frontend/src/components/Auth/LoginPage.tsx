import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/common/Button";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/auth/callback`;
const ENABLE_DEV_AUTH = import.meta.env.VITE_ENABLE_DEV_AUTH === "true";

// OAuth stateパラメータ用のキー
const OAUTH_STATE_KEY = "oauth_state";

// Google OAuth URLを生成
const getGoogleOAuthUrl = () => {
  // CSRF対策: stateパラメータを生成してsessionStorageに保存
  const state = crypto.randomUUID();
  sessionStorage.setItem(OAUTH_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "email profile",
    access_type: "offline",
    prompt: "consent",
    state: state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export function LoginPage() {
  const { isLoading, devLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isDevLoading, setIsDevLoading] = useState(false);

  // URLパラメータからエラーを取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // エラーパラメータをURLから削除
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError("Google Client IDが設定されていません");
      return;
    }
    window.location.href = getGoogleOAuthUrl();
  };

  const handleDevLogin = async () => {
    setIsDevLoading(true);
    setError(null);
    try {
      await devLogin();
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "開発環境ログインに失敗しました");
    } finally {
      setIsDevLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Assistant Scheduler
          </h1>
          <p className="mt-2 text-gray-600">
            スケジュール管理をAIがサポートします
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-4">
          <Button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Googleでログイン
          </Button>

          {ENABLE_DEV_AUTH && (
            <Button
              onClick={handleDevLogin}
              disabled={isDevLoading}
              className="w-full flex items-center justify-center gap-3 bg-amber-100 border border-amber-300 text-amber-800 hover:bg-amber-200 py-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              {isDevLoading ? "ログイン中..." : "開発環境ログイン"}
            </Button>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          ログインすると、あなた専用のスケジュールを管理できます
        </p>
      </div>
    </div>
  );
}
