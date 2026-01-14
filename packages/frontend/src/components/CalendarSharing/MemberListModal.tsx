import type { CalendarMemberResponse, MemberRole } from "@ai-scheduler/shared";
import { useState } from "react";
import {
  useCalendarMembers,
  useRemoveCalendarMember,
  useTransferCalendarOwnership,
  useUpdateCalendarMemberRole,
} from "../../hooks/useCalendarMembers";
import { useCalendar } from "../../hooks/useCalendars";
import { Modal } from "../common/Modal";

interface MemberListModalProps {
  calendarId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "オーナー",
  admin: "管理者",
  editor: "編集者",
  viewer: "閲覧者",
};

const ASSIGNABLE_ROLES: MemberRole[] = ["admin", "editor", "viewer"];

export const MemberListModal = ({ calendarId, isOpen, onClose }: MemberListModalProps) => {
  const { data: calendar } = useCalendar(calendarId ?? "");
  const { data: members, isLoading } = useCalendarMembers(calendarId ?? "");
  const updateRole = useUpdateCalendarMemberRole();
  const removeMember = useRemoveCalendarMember();
  const transferOwnership = useTransferCalendarOwnership();
  const [confirmAction, setConfirmAction] = useState<{
    type: "remove" | "transfer";
    member: CalendarMemberResponse;
  } | null>(null);

  if (!calendarId) return null;

  const canManageMembers = calendar?.role === "owner" || calendar?.role === "admin";

  const handleRoleChange = async (userId: string, role: MemberRole) => {
    await updateRole.mutateAsync({
      calendarId,
      targetUserId: userId,
      input: { role },
    });
  };

  const handleRemove = async (member: CalendarMemberResponse) => {
    await removeMember.mutateAsync({
      calendarId,
      targetUserId: member.userId,
    });
    setConfirmAction(null);
  };

  const handleTransfer = async (member: CalendarMemberResponse) => {
    await transferOwnership.mutateAsync({
      calendarId,
      input: { newOwnerId: member.userId },
    });
    setConfirmAction(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="メンバー管理">
      {confirmAction ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            {confirmAction.type === "remove" ? (
              <>
                {confirmAction.member.user.name}
                をカレンダーから削除しますか？
              </>
            ) : (
              <>
                {confirmAction.member.user.name}
                にオーナー権限を移譲しますか？
                <br />
                あなたは管理者になります。
              </>
            )}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirmAction(null)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              キャンセル
            </button>
            <button
              onClick={() =>
                confirmAction.type === "remove"
                  ? handleRemove(confirmAction.member)
                  : handleTransfer(confirmAction.member)
              }
              disabled={removeMember.isPending || transferOwnership.isPending}
              className={`px-4 py-2 text-sm text-white rounded-md disabled:opacity-50 ${
                confirmAction.type === "remove"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {confirmAction.type === "remove"
                ? removeMember.isPending
                  ? "削除中..."
                  : "削除"
                : transferOwnership.isPending
                  ? "移譲中..."
                  : "移譲"}
            </button>
          </div>
        </div>
      ) : isLoading ? (
        <div className="py-4 text-center text-gray-500">読み込み中...</div>
      ) : !members?.length ? (
        <div className="py-4 text-center text-gray-500">メンバーがいません</div>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
            >
              {member.user.picture ? (
                <img src={member.user.picture} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                  {member.user.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{member.user.name}</div>
                <div className="text-xs text-gray-500 truncate">{member.user.email}</div>
              </div>
              {member.role === "owner" ? (
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  {ROLE_LABELS[member.role]}
                </span>
              ) : canManageMembers ? (
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.userId, e.target.value as MemberRole)}
                  disabled={updateRole.isPending}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                  {ASSIGNABLE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-gray-500">{ROLE_LABELS[member.role]}</span>
              )}
              {canManageMembers && member.role !== "owner" && (
                <div className="flex gap-1">
                  {calendar?.role === "owner" && (
                    <button
                      onClick={() => setConfirmAction({ type: "transfer", member })}
                      className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded"
                      title="オーナー移譲"
                    >
                      移譲
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmAction({ type: "remove", member })}
                    className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                    title="メンバー削除"
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {!confirmAction && (
        <div className="flex justify-end pt-4 border-t mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
          >
            閉じる
          </button>
        </div>
      )}
    </Modal>
  );
};
