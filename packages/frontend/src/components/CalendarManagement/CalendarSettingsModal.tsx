import { useState } from "react";
import { useCalendar, useUpdateCalendar, useDeleteCalendar } from "../../hooks/useCalendars";
import { Modal } from "../common/Modal";

interface CalendarSettingsModalProps {
  calendarId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onMembersClick?: () => void;
  onInvitationsClick?: () => void;
}

const PRESET_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#6366F1",
];

type CalendarSettingsFormProps = {
  calendar: NonNullable<ReturnType<typeof useCalendar>["data"]>;
  onClose: () => void;
  onMembersClick?: () => void;
  onInvitationsClick?: () => void;
};

const CalendarSettingsForm = ({
  calendar,
  onClose,
  onMembersClick,
  onInvitationsClick,
}: CalendarSettingsFormProps) => {
  const updateCalendar = useUpdateCalendar();
  const deleteCalendar = useDeleteCalendar();
  const [name, setName] = useState(calendar.name);
  const [color, setColor] = useState(calendar.color);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await updateCalendar.mutateAsync({
      id: calendar.id,
      input: { name: name.trim(), color },
    });
    onClose();
  };

  const handleDelete = async () => {
    await deleteCalendar.mutateAsync(calendar.id);
    onClose();
  };

  const canEdit = calendar.role === "owner" || calendar.role === "admin";
  const canDelete = calendar.role === "owner";

  if (showDeleteConfirm) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          カレンダー「{calendar.name}」を削除しますか？
          <br />
          この操作は取り消せません。
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
          >
            キャンセル
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteCalendar.isPending}
            className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
          >
            {deleteCalendar.isPending ? "削除中..." : "削除"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          カレンダー名
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={100}
          disabled={!canEdit}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          カラー
        </label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((presetColor) => (
            <button
              key={presetColor}
              type="button"
              onClick={() => canEdit && setColor(presetColor)}
              disabled={!canEdit}
              className={`w-8 h-8 rounded-full border-2 ${
                color === presetColor
                  ? "border-gray-800 ring-2 ring-offset-1 ring-gray-400"
                  : "border-gray-200"
              } ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{ backgroundColor: presetColor }}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="text-sm text-gray-600">
          オーナー: {calendar.owner.name}
        </div>
        <div className="text-sm text-gray-600">
          メンバー: {calendar.memberCount}人
        </div>
        <div className="text-sm text-gray-600">
          あなたの権限: {calendar.role}
        </div>
      </div>

      {(onMembersClick || onInvitationsClick) && canEdit && (
        <div className="border-t border-gray-200 pt-4 space-y-2">
          {onMembersClick && (
            <button
              type="button"
              onClick={onMembersClick}
              className="w-full text-left text-sm text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded"
            >
              メンバーを管理
            </button>
          )}
          {onInvitationsClick && (
            <button
              type="button"
              onClick={onInvitationsClick}
              className="w-full text-left text-sm text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded"
            >
              招待リンクを管理
            </button>
          )}
        </div>
      )}

      <div className="flex justify-between pt-2">
        {canDelete && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
          >
            削除
          </button>
        )}
        <div className="flex gap-2 ml-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
          >
            キャンセル
          </button>
          {canEdit && (
            <button
              type="submit"
              disabled={!name.trim() || updateCalendar.isPending}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {updateCalendar.isPending ? "保存中..." : "保存"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export const CalendarSettingsModal = ({
  calendarId,
  isOpen,
  onClose,
  onMembersClick,
  onInvitationsClick,
}: CalendarSettingsModalProps) => {
  const { data: calendar, isLoading } = useCalendar(calendarId ?? "");

  if (!calendarId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="カレンダー設定">
      {isLoading ? (
        <div className="py-4 text-center text-gray-500">読み込み中...</div>
      ) : !calendar ? (
        <div className="py-4 text-center text-red-500">
          カレンダーが見つかりません
        </div>
      ) : (
        <CalendarSettingsForm
          key={calendar.id}
          calendar={calendar}
          onClose={onClose}
          onMembersClick={onMembersClick}
          onInvitationsClick={onInvitationsClick}
        />
      )}
    </Modal>
  );
};
