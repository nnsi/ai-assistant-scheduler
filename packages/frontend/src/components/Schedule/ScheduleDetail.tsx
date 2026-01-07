import { useState } from "react";
import { Calendar, Clock, Trash2, Edit, MapPin, ExternalLink, Store } from "lucide-react";
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
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          {schedule.title}
        </h3>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDateString(schedule.startAt, "yyyy年M月d日")}</span>
          </div>
          {schedule.isAllDay ? (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
              終日
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDateString(schedule.startAt, "HH:mm")}</span>
            </div>
          )}
        </div>
      </div>

      {/* 選択されたお店 */}
      {schedule.supplement?.selectedShop && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Store className="w-4 h-4 sm:w-5 sm:h-5 text-green-700" />
            <h4 className="text-xs sm:text-sm font-medium text-green-900">決定したお店</h4>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-sm sm:text-base text-gray-900">
              {schedule.supplement.selectedShop.name}
            </p>
            {schedule.supplement.selectedShop.summary && (
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                {schedule.supplement.selectedShop.summary}
              </p>
            )}
            <div className="text-xs sm:text-sm text-gray-500 space-y-1">
              {schedule.supplement.selectedShop.businessHours && (
                <div className="flex items-start gap-1">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 mt-0.5" />
                  <span className="break-words">{schedule.supplement.selectedShop.businessHours}</span>
                  {schedule.supplement.selectedShop.closedDays && (
                    <span className="text-gray-400 hidden sm:inline">
                      （{schedule.supplement.selectedShop.closedDays}）
                    </span>
                  )}
                </div>
              )}
              {schedule.supplement.selectedShop.address && (
                <div className="flex items-start gap-1">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 mt-0.5" />
                  <span className="break-words">{schedule.supplement.selectedShop.address}</span>
                </div>
              )}
            </div>
            {schedule.supplement.selectedShop.urls && (
              <div className="flex flex-wrap gap-2 sm:gap-3 pt-2">
                {schedule.supplement.selectedShop.urls.official && (
                  <a
                    href={schedule.supplement.selectedShop.urls.official}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-green-700 hover:underline flex items-center gap-1"
                  >
                    公式 <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </a>
                )}
                {schedule.supplement.selectedShop.urls.reservation && (
                  <a
                    href={schedule.supplement.selectedShop.urls.reservation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    予約 <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </a>
                )}
                {schedule.supplement.selectedShop.urls.tabelog && (
                  <a
                    href={schedule.supplement.selectedShop.urls.tabelog}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-orange-600 hover:underline flex items-center gap-1"
                  >
                    食べログ <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </a>
                )}
                {schedule.supplement.selectedShop.urls.googleMap && (
                  <a
                    href={schedule.supplement.selectedShop.urls.googleMap}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    地図 <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI検索結果 */}
      {schedule.supplement?.aiResult && (
        <details className="bg-purple-50 rounded-lg p-3 sm:p-4">
          <summary className="text-xs sm:text-sm font-medium text-purple-900 cursor-pointer hover:text-purple-700">
            AI検索結果を表示
          </summary>
          <div className="mt-2 sm:mt-3">
            <MarkdownRenderer
              content={schedule.supplement.aiResult}
              className="text-xs sm:text-sm"
            />
          </div>
        </details>
      )}

      {/* メモ */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs sm:text-sm font-medium text-gray-700">メモ</h4>
          {!isEditingMemo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingMemo(true)}
            >
              <Edit className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">編集</span>
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
                "w-full px-3 py-2 border rounded-md shadow-sm text-sm",
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
          <MarkdownRenderer content={schedule.supplement.userMemo} className="text-xs sm:text-sm" />
        ) : (
          <p className="text-xs sm:text-sm text-gray-400">メモはありません</p>
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
          <Trash2 className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">削除</span>
        </Button>
        <Button variant="secondary" size="sm" onClick={onEdit}>
          <Edit className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">編集</span>
        </Button>
      </div>
    </div>
  );
};
