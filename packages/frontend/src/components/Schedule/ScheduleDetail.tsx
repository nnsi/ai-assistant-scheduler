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
    <div className="space-y-5">
      {/* タイトルと日時 */}
      <div>
        <h3 className="text-xl sm:text-2xl font-display text-stone-900 mb-3">
          {schedule.title}
        </h3>
        <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
          <div className="flex items-center gap-2 bg-stone-100 rounded-lg px-3 py-1.5">
            <Calendar className="w-4 h-4 text-stone-500" />
            <span>
              {formatDateString(schedule.startAt, "yyyy年M月d日")}
              {schedule.endAt &&
                formatDateString(schedule.startAt, "yyyy-MM-dd") !==
                  formatDateString(schedule.endAt, "yyyy-MM-dd") &&
                ` - ${formatDateString(schedule.endAt, "M月d日")}`}
            </span>
          </div>
          {schedule.isAllDay ? (
            <span className="px-3 py-1.5 bg-accent/10 text-accent-dark rounded-lg text-sm font-medium">
              終日
            </span>
          ) : (
            <div className="flex items-center gap-2 bg-stone-100 rounded-lg px-3 py-1.5">
              <Clock className="w-4 h-4 text-stone-500" />
              <span>
                {formatDateString(schedule.startAt, "HH:mm")}
                {schedule.endAt && ` - ${formatDateString(schedule.endAt, "HH:mm")}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 選択されたお店 */}
      {schedule.supplement?.selectedShops && schedule.supplement.selectedShops.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Store className="w-4 h-4 text-emerald-700" />
            </div>
            <h4 className="text-sm font-medium text-emerald-900">
              行きたいお店（{schedule.supplement.selectedShops.length}件）
            </h4>
          </div>
          <div className="space-y-3">
            {schedule.supplement.selectedShops.map((shop, index) => (
              <div
                key={`${shop.name}-${index}`}
                className={cn(
                  "bg-white rounded-lg p-3",
                  index > 0 && "border-t border-emerald-100"
                )}
              >
                <p className="font-medium text-base text-stone-900">
                  {shop.name}
                </p>
                {shop.summary && (
                  <p className="text-sm text-stone-600 line-clamp-2 mt-1">
                    {shop.summary}
                  </p>
                )}
                <div className="text-sm text-stone-500 space-y-1.5 mt-2">
                  {shop.businessHours && (
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 shrink-0 mt-0.5 text-stone-400" />
                      <span className="break-words">{shop.businessHours}</span>
                      {shop.closedDays && (
                        <span className="text-stone-400 hidden sm:inline">
                          （{shop.closedDays}）
                        </span>
                      )}
                    </div>
                  )}
                  {shop.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-stone-400" />
                      <span className="break-words">{shop.address}</span>
                    </div>
                  )}
                </div>
                {shop.urls && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {shop.urls.official && (
                      <a
                        href={shop.urls.official}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg px-2 py-1 flex items-center gap-1 transition-colors"
                      >
                        公式 <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {shop.urls.reservation && (
                      <a
                        href={shop.urls.reservation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg px-2 py-1 flex items-center gap-1 transition-colors"
                      >
                        予約 <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {shop.urls.tabelog && (
                      <a
                        href={shop.urls.tabelog}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg px-2 py-1 flex items-center gap-1 transition-colors"
                      >
                        食べログ <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {shop.urls.googleMap && (
                      <a
                        href={shop.urls.googleMap}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg px-2 py-1 flex items-center gap-1 transition-colors"
                      >
                        地図 <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI検索結果 */}
      {schedule.supplement?.aiResult && (
        <details className="bg-violet-50 border border-violet-100 rounded-xl overflow-hidden group">
          <summary className="px-4 py-3 text-sm font-medium text-violet-900 cursor-pointer hover:bg-violet-100/50 transition-colors select-none">
            AI検索結果を表示
          </summary>
          <div className="px-4 pb-4 pt-1 border-t border-violet-100">
            <MarkdownRenderer
              content={schedule.supplement.aiResult}
              className="text-sm"
            />
          </div>
        </details>
      )}

      {/* メモ */}
      <div className="bg-stone-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-stone-700">メモ</h4>
          {!isEditingMemo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingMemo(true)}
              className="text-stone-600"
            >
              <Edit className="w-4 h-4" />
              <span className="ml-1 hidden sm:inline">編集</span>
            </Button>
          )}
        </div>

        {isEditingMemo ? (
          <div className="space-y-3">
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={4}
              placeholder="メモを入力..."
              className={cn(
                "w-full px-4 py-3 rounded-xl border border-stone-200 bg-white",
                "text-sm text-stone-800 placeholder:text-stone-400",
                "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
                "transition-all duration-200"
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
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
          <MarkdownRenderer content={schedule.supplement.userMemo} className="text-sm" />
        ) : (
          <p className="text-sm text-stone-400">メモはありません</p>
        )}
      </div>

      {/* アクションボタン */}
      <div className="flex justify-between pt-4 border-t border-stone-100">
        <Button
          variant="danger"
          size="sm"
          onClick={onDelete}
          isLoading={isDeleting}
        >
          <Trash2 className="w-4 h-4" />
          <span className="ml-1 hidden sm:inline">削除</span>
        </Button>
        <Button variant="primary" size="sm" onClick={onEdit}>
          <Edit className="w-4 h-4" />
          <span className="ml-1 hidden sm:inline">編集</span>
        </Button>
      </div>
    </div>
  );
};
