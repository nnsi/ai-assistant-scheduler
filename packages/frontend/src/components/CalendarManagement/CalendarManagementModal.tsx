import { useState } from "react";
import { Modal } from "../common/Modal";
import { CalendarColorDot } from "./CalendarColorDot";
import { useCalendarContext } from "../../contexts/CalendarContext";

interface CalendarManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClick: () => void;
  onSettingsClick: (calendarId: string) => void;
}

export const CalendarManagementModal = ({
  isOpen,
  onClose,
  onCreateClick,
  onSettingsClick,
}: CalendarManagementModalProps) => {
  const {
    calendars,
    isLoading,
    selectedCalendarIds,
    defaultCalendarId,
    toggleCalendar,
    selectAllCalendars,
    setDefaultCalendar,
  } = useCalendarContext();
  const [showDefaultSelect, setShowDefaultSelect] = useState(false);

  const handleSettingsClick = (calendarId: string) => {
    onClose();
    onSettingsClick(calendarId);
  };

  const handleCreateClick = () => {
    onClose();
    onCreateClick();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="カレンダー管理">
      {isLoading ? (
        <div className="py-4 text-center text-gray-500">読み込み中...</div>
      ) : showDefaultSelect ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            新規予定の追加先となるデフォルトカレンダーを選択してください
          </p>
          <div className="space-y-2">
            {calendars
              .filter((cal) => cal.role !== "viewer")
              .map((calendar) => (
                <button
                  key={calendar.id}
                  onClick={() => {
                    setDefaultCalendar(calendar.id);
                    setShowDefaultSelect(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    defaultCalendarId === calendar.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <CalendarColorDot color={calendar.color} size="md" />
                  <span className="flex-1 text-left text-sm font-medium">
                    {calendar.name}
                  </span>
                  {defaultCalendarId === calendar.id && (
                    <span className="text-xs text-blue-600">現在のデフォルト</span>
                  )}
                </button>
              ))}
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setShowDefaultSelect(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              戻る
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Calendar List */}
          <div className="space-y-2">
            {calendars.map((calendar) => (
              <div
                key={calendar.id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedCalendarIds.includes(calendar.id)}
                  onChange={() => toggleCalendar(calendar.id)}
                  className="rounded border-gray-300"
                />
                <CalendarColorDot color={calendar.color} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {calendar.name}
                    </span>
                    {defaultCalendarId === calendar.id && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        デフォルト
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {calendar.role === "owner"
                      ? "オーナー"
                      : calendar.role === "admin"
                        ? "管理者"
                        : calendar.role === "editor"
                          ? "編集者"
                          : "閲覧者"}
                    {calendar.memberCount > 1 && ` · ${calendar.memberCount}人`}
                  </div>
                </div>
                <button
                  onClick={() => handleSettingsClick(calendar.id)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="設定"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <button
              onClick={selectAllCalendars}
              className="w-full text-left text-sm text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg"
            >
              すべて表示
            </button>
            <button
              onClick={() => setShowDefaultSelect(true)}
              className="w-full text-left text-sm text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg"
            >
              デフォルトカレンダーを変更
            </button>
            <button
              onClick={handleCreateClick}
              className="w-full text-left text-sm text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg font-medium"
            >
              + 新しいカレンダーを作成
            </button>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-2">
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
