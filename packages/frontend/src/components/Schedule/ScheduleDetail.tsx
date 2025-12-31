import { useState } from "react";
import { Calendar, Clock, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/common/Button";
import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";
import { formatDateString } from "@/lib/date";
import { cn } from "@/lib/cn";
import type { ScheduleWithSupplement } from "@ai-scheduler/shared";

type ScheduleDetailProps = {
  schedule: ScheduleWithSupplement;
  onEdit: () => void;
  onDelete: () => void;
  onMemoSave: (memo: string) => void;
  isDeleting?: boolean;
  isSavingMemo?: boolean;
};

export const ScheduleDetail = ({
  schedule,
  onEdit,
  onDelete,
  onMemoSave,
  isDeleting = false,
  isSavingMemo = false,
}: ScheduleDetailProps) => {
  const [memo, setMemo] = useState(schedule.supplement?.userMemo || "");
  const [isEditingMemo, setIsEditingMemo] = useState(false);

  const handleSaveMemo = () => {
    onMemoSave(memo);
    setIsEditingMemo(false);
  };

  return (
    <div className="space-y-6">
      {/* タイトルと日時 */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {schedule.title}
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDateString(schedule.startAt, "yyyy年M月d日")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatDateString(schedule.startAt, "HH:mm")}</span>
          </div>
        </div>
      </div>

      {/* AI検索結果 */}
      {schedule.supplement?.aiResult && (
        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-purple-900 mb-2">
            AI検索結果
          </h4>
          <MarkdownRenderer
            content={schedule.supplement.aiResult}
            className="text-sm"
          />
        </div>
      )}

      {/* メモ */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">メモ</h4>
          {!isEditingMemo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingMemo(true)}
            >
              <Edit className="w-4 h-4 mr-1" />
              編集
            </Button>
          )}
        </div>

        {isEditingMemo ? (
          <div className="space-y-2">
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={4}
              placeholder="メモを入力..."
              className={cn(
                "w-full px-3 py-2 border rounded-md shadow-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                "border-gray-300"
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditingMemo(false)}
              >
                キャンセル
              </Button>
              <Button size="sm" onClick={handleSaveMemo} isLoading={isSavingMemo}>
                保存
              </Button>
            </div>
          </div>
        ) : schedule.supplement?.userMemo ? (
          <MarkdownRenderer content={schedule.supplement.userMemo} />
        ) : (
          <p className="text-sm text-gray-400">メモはありません</p>
        )}
      </div>

      {/* アクションボタン */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="danger"
          size="sm"
          onClick={onDelete}
          isLoading={isDeleting}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          削除
        </Button>
        <Button variant="secondary" size="sm" onClick={onEdit}>
          <Edit className="w-4 h-4 mr-1" />
          編集
        </Button>
      </div>
    </div>
  );
};
