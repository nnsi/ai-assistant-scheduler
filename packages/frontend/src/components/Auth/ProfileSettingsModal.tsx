import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/contexts/AuthContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// OAuth stateパラメータ用のキー（再認証用）
export const OAUTH_RECONNECT_STATE_KEY = "oauth_reconnect_state";

type ProfileSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// Google OAuth URLを生成（再認証用）
const getGoogleReconnectUrl = () => {
  // CSRF対策: stateパラメータを生成してsessionStorageに保存
  const state = crypto.randomUUID();
  sessionStorage.setItem(OAUTH_RECONNECT_STATE_KEY, state);

  const redirectUri = `${window.location.origin}/auth/reconnect-callback`;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "email profile",
    access_type: "offline",
    prompt: "consent",
    state: state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { user, updateEmail } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setEmailError("メールアドレスを入力してください");
      return;
    }

    setIsUpdatingEmail(true);
    setEmailError(null);
    setEmailSuccess(false);

    try {
      await updateEmail(email);
      setEmailSuccess(true);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "更新に失敗しました");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleGoogleReconnect = () => {
    if (!GOOGLE_CLIENT_ID) {
      setEmailError("Google Client IDが設定されていません");
      return;
    }
    // 再認証用のURLにリダイレクト
    window.location.href = getGoogleReconnectUrl();
  };

  const handleClose = () => {
    setEmailError(null);
    setEmailSuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="プロフィール設定">
      <div className="space-y-6">
        {/* ユーザー情報 */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          {user?.picture && (
            <img
              src={user.picture}
              alt={user.name}
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <div className="font-medium text-gray-900">{user?.name}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
          </div>
        </div>

        {/* メールアドレス更新フォーム */}
        <form onSubmit={handleEmailUpdate} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="example@email.com"
            />
          </div>

          {emailError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {emailError}
            </div>
          )}

          {emailSuccess && (
            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
              メールアドレスを更新しました
            </div>
          )}

          <Button
            type="submit"
            disabled={isUpdatingEmail || email === user?.email}
            className="w-full"
          >
            {isUpdatingEmail ? "更新中..." : "メールアドレスを更新"}
          </Button>
        </form>

        {/* Google認証再設定 */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Googleアカウント連携
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            別のGoogleアカウントに紐づけ直すことができます。現在の認証情報は新しいアカウントに置き換わります。
          </p>
          <Button
            onClick={handleGoogleReconnect}
            variant="secondary"
            className="w-full flex items-center justify-center gap-2"
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
            Googleアカウントを再設定
          </Button>
        </div>
      </div>
    </Modal>
  );
}
