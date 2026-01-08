import { useState } from "react";
import { useCalendarContext } from "../../contexts/CalendarContext";
import { CalendarColorDot } from "./CalendarColorDot";

interface CalendarSelectorProps {
  onManageClick?: () => void;
  onSettingsClick?: (calendarId: string) => void;
}

export const CalendarSelector = ({
  onManageClick,
  onSettingsClick,
}: CalendarSelectorProps) => {
  const {
    calendars,
    isLoading,
    selectedCalendarIds,
    toggleCalendar,
    selectAllCalendars,
  } = useCalendarContext();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-gray-500">
        カレンダーを読み込み中...
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md w-full"
      >
        <span>カレンダー</span>
        <span className="ml-auto text-gray-400">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-2 space-y-1">
            {calendars.map((calendar) => (
              <div
                key={calendar.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedCalendarIds.includes(calendar.id)}
                  onChange={() => toggleCalendar(calendar.id)}
                  className="rounded border-gray-300"
                />
                <CalendarColorDot color={calendar.color} />
                <span className="flex-1 text-sm truncate">{calendar.name}</span>
                {calendar.memberCount > 1 && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    {calendar.memberCount}人
                  </span>
                )}
                {onSettingsClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSettingsClick(calendar.id);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ⚙️
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 p-2">
            <button
              onClick={selectAllCalendars}
              className="w-full text-left text-sm text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded"
            >
              すべて選択
            </button>
            {onManageClick && (
              <button
                onClick={onManageClick}
                className="w-full text-left text-sm text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded"
              >
                + 新しいカレンダー
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
