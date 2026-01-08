import { useState } from "react";
import { Modal } from "../common/Modal";
import { useAddCalendarMember } from "../../hooks/useCalendarMembers";
import type { MemberRole } from "@ai-scheduler/shared";

interface InviteMemberModalProps {
  calendarId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS: { value: MemberRole; label: string; description: string }[] = [
  {
    value: "admin",
    label: "管理者",
    description: "メンバー管理や設定変更が可能",
  },
  {
    value: "editor",
    label: "編集者",
    description: "スケジュールの作成・編集が可能",
  },
  {
    value: "viewer",
    label: "閲覧者",
    description: "スケジュールの閲覧のみ",
  },
];

export const InviteMemberModal = ({
  calendarId,
  isOpen,
  onClose,
}: InviteMemberModalProps) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("editor");
  const [error, setError] = useState<string | null>(null);
  const addMember = useAddCalendarMember();

  if (!calendarId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) return;

    try {
      await addMember.mutateAsync({
        calendarId,
        input: { email: email.trim(), role },
      });
      setEmail("");
      setRole("editor");
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("not found")) {
          setError("このメールアドレスのユーザーが見つかりません");
        } else if (err.message.includes("already")) {
          setError("このユーザーは既にメンバーです");
        } else {
          setError("招待に失敗しました");
        }
      }
    }
  };

  const handleClose = () => {
    setEmail("");
    setRole("editor");
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="メンバーを招待">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            既に登録済みのユーザーのみ招待できます
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            権限
          </label>
          <div className="space-y-2">
            {ROLE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-start p-3 border rounded-lg cursor-pointer ${
                  role === option.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={(e) => setRole(e.target.value as MemberRole)}
                  className="mt-0.5"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500">
                    {option.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={!email.trim() || addMember.isPending}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
          >
            {addMember.isPending ? "招待中..." : "招待"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
