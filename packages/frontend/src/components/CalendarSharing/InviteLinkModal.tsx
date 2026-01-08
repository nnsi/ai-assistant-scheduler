import { useState } from "react";
import { Modal } from "../common/Modal";
import {
  useCalendarInvitations,
  useCreateCalendarInvitation,
  useRevokeCalendarInvitation,
} from "../../hooks/useCalendarInvitations";
import type {
  InvitationRole,
  InvitationListItemResponse,
} from "@ai-scheduler/shared";
import { format } from "date-fns";

interface InviteLinkModalProps {
  calendarId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS: { value: InvitationRole; label: string }[] = [
  { value: "editor", label: "編集者" },
  { value: "viewer", label: "閲覧者" },
];

export const InviteLinkModal = ({
  calendarId,
  isOpen,
  onClose,
}: InviteLinkModalProps) => {
  const { data: invitations, isLoading } = useCalendarInvitations(
    calendarId ?? ""
  );
  const createInvitation = useCreateCalendarInvitation();
  const revokeInvitation = useRevokeCalendarInvitation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [role, setRole] = useState<InvitationRole>("editor");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [maxUses, setMaxUses] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newInviteUrl, setNewInviteUrl] = useState<string | null>(null);
  const [revokeConfirm, setRevokeConfirm] = useState<InvitationListItemResponse | null>(null);

  if (!calendarId) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createInvitation.mutateAsync({
      calendarId,
      input: {
        role,
        expiresInDays,
        maxUses,
      },
    });
    setNewInviteUrl(result.url);
    setShowCreateForm(false);
    setRole("editor");
    setExpiresInDays(7);
    setMaxUses(null);
  };

  const handleRevoke = async (invitation: InvitationListItemResponse) => {
    await revokeInvitation.mutateAsync({
      calendarId,
      invitationId: invitation.id,
    });
    setRevokeConfirm(null);
  };

  const copyToClipboard = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="招待リンク">
      {revokeConfirm ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            この招待リンクを無効にしますか？
            <br />
            既にこのリンクで参加したメンバーには影響しません。
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRevokeConfirm(null)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              キャンセル
            </button>
            <button
              onClick={() => handleRevoke(revokeConfirm)}
              disabled={revokeInvitation.isPending}
              className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
            >
              {revokeInvitation.isPending ? "無効化中..." : "無効化"}
            </button>
          </div>
        </div>
      ) : newInviteUrl ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 mb-2">
              招待リンクを作成しました
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newInviteUrl}
                readOnly
                className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-md bg-white"
              />
              <button
                onClick={() => copyToClipboard(newInviteUrl, "new")}
                className="px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md whitespace-nowrap"
              >
                {copiedId === "new" ? "コピー済み" : "コピー"}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setNewInviteUrl(null)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              閉じる
            </button>
          </div>
        </div>
      ) : showCreateForm ? (
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              権限
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as InvitationRole)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              有効期限
            </label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value={1}>1日</option>
              <option value={3}>3日</option>
              <option value={7}>7日</option>
              <option value={14}>14日</option>
              <option value={30}>30日</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              使用回数制限
            </label>
            <select
              value={maxUses ?? ""}
              onChange={(e) =>
                setMaxUses(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">無制限</option>
              <option value={1}>1回</option>
              <option value={5}>5回</option>
              <option value={10}>10回</option>
              <option value={25}>25回</option>
              <option value={50}>50回</option>
              <option value={100}>100回</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={createInvitation.isPending}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {createInvitation.isPending ? "作成中..." : "作成"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full py-2 text-sm text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-md"
          >
            + 新しい招待リンクを作成
          </button>

          {isLoading ? (
            <div className="py-4 text-center text-gray-500">読み込み中...</div>
          ) : !invitations?.length ? (
            <div className="py-4 text-center text-gray-500">
              招待リンクがありません
            </div>
          ) : (
            <div className="space-y-2">
              {invitations.map((invitation) => {
                const expired = isExpired(invitation.expiresAt);
                const exhausted =
                  invitation.maxUses !== null &&
                  invitation.useCount >= invitation.maxUses;

                return (
                  <div
                    key={invitation.id}
                    className={`p-3 border rounded-lg ${
                      expired || exhausted
                        ? "border-gray-200 bg-gray-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {invitation.tokenPreview}
                        </code>
                        <span className="text-xs text-gray-500">
                          {invitation.role === "editor" ? "編集者" : "閲覧者"}
                        </span>
                      </div>
                      {(expired || exhausted) && (
                        <span className="text-xs text-red-500">
                          {expired ? "期限切れ" : "使用上限到達"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>
                        期限: {format(new Date(invitation.expiresAt), "yyyy/MM/dd HH:mm")}
                        {invitation.maxUses !== null && (
                          <span className="ml-2">
                            使用: {invitation.useCount}/{invitation.maxUses}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setRevokeConfirm(invitation)}
                        className="text-red-500 hover:text-red-700"
                      >
                        無効化
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
