import { useState } from "react";
import { useCreateCalendar } from "../../hooks/useCalendars";
import { Modal } from "../common/Modal";

interface CalendarCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
];

export const CalendarCreateModal = ({ isOpen, onClose }: CalendarCreateModalProps) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const createCalendar = useCreateCalendar();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createCalendar.mutateAsync({ name: name.trim(), color });
    setName("");
    setColor(PRESET_COLORS[0]);
    onClose();
  };

  const handleClose = () => {
    setName("");
    setColor(PRESET_COLORS[0]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="新しいカレンダー">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">カレンダー名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="カレンダー名を入力"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">カラー</label>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                type="button"
                onClick={() => setColor(presetColor)}
                className={`w-8 h-8 rounded-full border-2 ${
                  color === presetColor
                    ? "border-gray-800 ring-2 ring-offset-1 ring-gray-400"
                    : "border-gray-200"
                }`}
                style={{ backgroundColor: presetColor }}
              />
            ))}
          </div>
        </div>

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
            disabled={!name.trim() || createCalendar.isPending}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
          >
            {createCalendar.isPending ? "作成中..." : "作成"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
