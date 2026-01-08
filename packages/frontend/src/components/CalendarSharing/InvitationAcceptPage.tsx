import { useRef, useState } from "react";
import {
  useInvitationInfo,
  useAcceptInvitation,
} from "../../hooks/useCalendarInvitations";
import { CalendarColorDot } from "../CalendarManagement/CalendarColorDot";

const ROLE_LABELS: Record<string, string> = {
  editor: "編集者",
  viewer: "閲覧者",
};

const getTokenFromPath = (): string => {
  const path = window.location.pathname;
  const match = path.match(/^\/invite\/(.+)$/);
  return match ? match[1] : "";
};

const navigateTo = (path: string) => {
  window.location.href = path;
};

export const InvitationAcceptPage = () => {
  const token = getTokenFromPath();
  const { data: info, isLoading, error } = useInvitationInfo(token);
  const acceptInvitation = useAcceptInvitation();
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const isProcessingRef = useRef(false);
  const [isAccepted, setIsAccepted] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-xl font-bold text-red-600 mb-4">
            無効な招待リンク
          </h1>
          <p className="text-gray-600 mb-4">
            招待リンクが正しくありません。
          </p>
          <button
            onClick={() => navigateTo("/")}
            className="w-full py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  const handleAccept = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setAcceptError(null);

    try {
      await acceptInvitation.mutateAsync(token);
      setIsAccepted(true);
    } catch (err) {
      isProcessingRef.current = false;
      if (err instanceof Error) {
        if (err.message.includes("expired")) {
          setAcceptError("この招待リンクは期限切れです");
        } else if (err.message.includes("exhausted")) {
          setAcceptError("この招待リンクの使用回数上限に達しました");
        } else if (err.message.includes("already")) {
          setAcceptError("既にこのカレンダーのメンバーです");
        } else {
          setAcceptError("招待の受け入れに失敗しました");
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-xl font-bold text-red-600 mb-4">
            招待リンクが見つかりません
          </h1>
          <p className="text-gray-600 mb-4">
            この招待リンクは無効になっているか、期限切れです。
          </p>
          <button
            onClick={() => navigateTo("/")}
            className="w-full py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  if (isAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            カレンダーに参加しました
          </h1>
          <p className="text-gray-600 mb-6">
            「{info.calendarName}」の{ROLE_LABELS[info.role]}
            として参加しました。
          </p>
          <button
            onClick={() => navigateTo("/")}
            className="w-full py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            カレンダーを開く
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            カレンダーへの招待
          </h1>
          <p className="text-sm text-gray-500">
            {info.ownerName}さんからの招待です
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg mb-6">
          <div className="flex items-center gap-3 mb-3">
            <CalendarColorDot color={info.calendarColor} size="lg" />
            <div>
              <div className="font-medium text-gray-900">
                {info.calendarName}
              </div>
              <div className="text-sm text-gray-500">
                {ROLE_LABELS[info.role]}として参加
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            有効期限: {new Date(info.expiresAt).toLocaleDateString("ja-JP")}
          </div>
        </div>

        {acceptError && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {acceptError}
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={handleAccept}
            disabled={acceptInvitation.isPending}
            className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
          >
            {acceptInvitation.isPending ? "参加中..." : "参加する"}
          </button>
          <button
            onClick={() => navigateTo("/")}
            className="w-full py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};
