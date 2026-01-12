import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/cn";
import { useSearchModal } from "@ai-scheduler/core/hooks";
import { formatDateString } from "@/lib/date";
import type { Schedule } from "@ai-scheduler/shared";

type SearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onScheduleClick: (schedule: Schedule) => void;
};

export const SearchModal = ({
  isOpen,
  onClose,
  onScheduleClick,
}: SearchModalProps) => {
  const {
    // フィルター状態
    query,
    setQuery,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    categoryId,
    setCategoryId,
    // 検索状態
    results,
    isLoading,
    hasFilters,
    // データ
    categories,
    // ハンドラー
    handleSearch,
    handleClear,
    handleScheduleSelect,
  } = useSearchModal({
    onScheduleClick,
    onClose,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="予定を検索" size="lg">
      <div className="space-y-4">
        {/* 検索フォーム */}
        <div>
          <label
            htmlFor="search-query"
            className="block text-sm font-medium text-stone-700 mb-2"
          >
            キーワード
          </label>
          <input
            id="search-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="タイトルやメモで検索"
            className={cn(
              "w-full px-4 py-3 rounded-xl border bg-white",
              "text-stone-800 placeholder:text-stone-400",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
              "border-stone-200"
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="search-start"
              className="block text-sm font-medium text-stone-700 mb-2"
            >
              開始日
            </label>
            <input
              id="search-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl border bg-white",
                "text-stone-800",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
                "border-stone-200"
              )}
            />
          </div>
          <div>
            <label
              htmlFor="search-end"
              className="block text-sm font-medium text-stone-700 mb-2"
            >
              終了日
            </label>
            <input
              id="search-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl border bg-white",
                "text-stone-800",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
                "border-stone-200"
              )}
            />
          </div>
        </div>

        {categories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              カテゴリ
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryId(undefined)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm transition-all",
                  categoryId === undefined
                    ? "bg-stone-600 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                )}
              >
                すべて
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1.5",
                    categoryId === cat.id
                      ? "text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  )}
                  style={
                    categoryId === cat.id
                      ? { backgroundColor: cat.color }
                      : undefined
                  }
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSearch} isLoading={isLoading} className="flex-1">
            検索
          </Button>
          <Button variant="ghost" onClick={handleClear}>
            クリア
          </Button>
        </div>

        {/* 検索結果 */}
        {hasFilters && (
          <div className="border-t border-stone-200 pt-4 mt-4">
            <h3 className="text-sm font-medium text-stone-700 mb-3">
              検索結果 {results.length > 0 && `(${results.length}件)`}
            </h3>
            {isLoading ? (
              <div className="text-center py-8 text-stone-500">検索中...</div>
            ) : results.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                該当する予定が見つかりませんでした
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.map((schedule) => {
                  const categoryColor = schedule.category?.color;
                  return (
                    <button
                      key={schedule.id}
                      onClick={() => handleScheduleSelect(schedule)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl transition-all duration-200",
                        "hover:scale-[1.01]",
                        !categoryColor && "bg-stone-50 hover:bg-stone-100"
                      )}
                      style={
                        categoryColor
                          ? {
                              backgroundColor: `${categoryColor}15`,
                            }
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-2">
                        {categoryColor && (
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: categoryColor }}
                          />
                        )}
                        <span className="font-medium text-stone-800 truncate">
                          {schedule.title}
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 mt-1">
                        {formatDateString(schedule.startAt, "yyyy/MM/dd")}
                        {!schedule.isAllDay && (
                          <span className="ml-1">
                            {" "}
                            {formatDateString(schedule.startAt, "HH:mm")}
                          </span>
                        )}
                        {schedule.isAllDay && (
                          <span className="ml-1"> (終日)</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
