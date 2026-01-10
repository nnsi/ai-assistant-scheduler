import { useState, useRef, useEffect } from "react";
import { Loader2, Check, MapPin, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/common/Button";
import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";
import type { Shop, ShopList } from "@ai-scheduler/shared";

type SearchResultsProps = {
  result: string;
  shopCandidates?: ShopList;
  statusMessage?: string | null;
  isLoading?: boolean;
  isStreaming?: boolean;
  isSelectingShop?: boolean;
  onClose: () => void;
  onBack: () => void;
  onSelectShop?: (shop: Shop) => Promise<void>;
};

// お店カードコンポーネント
const ShopCard = ({
  shop,
  isSelected,
  isSelecting,
  onSelect,
}: {
  shop: Shop;
  isSelected: boolean;
  isSelecting: boolean;
  onSelect: () => void;
}) => {
  return (
    <div
      className={`border rounded-lg p-3 sm:p-4 transition-all ${
        isSelected
          ? "border-violet-500 bg-violet-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{shop.name}</h4>
          {shop.summary && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{shop.summary}</p>
          )}
          <div className="mt-2 space-y-1 text-xs sm:text-sm text-gray-500">
            {shop.businessHours && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">{shop.businessHours}</span>
                {shop.closedDays && <span className="text-gray-400 hidden sm:inline">（{shop.closedDays}）</span>}
              </div>
            )}
            {shop.address && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">{shop.address}</span>
              </div>
            )}
          </div>
          {shop.urls && (
            <div className="flex flex-wrap gap-2 mt-2">
              {shop.urls.official && (
                <a
                  href={shop.urls.official}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  公式 <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {shop.urls.tabelog && (
                <a
                  href={shop.urls.tabelog}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-600 hover:underline flex items-center gap-0.5"
                >
                  食べログ <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {shop.urls.googleMap && (
                <a
                  href={shop.urls.googleMap}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  地図 <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>
        <Button
          size="sm"
          variant={isSelected ? "ai" : "secondary"}
          onClick={onSelect}
          disabled={isSelecting}
          className="shrink-0 w-full sm:w-auto"
        >
          {isSelecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSelected ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              選択中
            </>
          ) : (
            "このお店に決定"
          )}
        </Button>
      </div>
    </div>
  );
};

export const SearchResults = ({
  result,
  shopCandidates,
  statusMessage,
  isLoading = false,
  isStreaming = false,
  isSelectingShop = false,
  onClose,
  onBack,
  onSelectShop,
}: SearchResultsProps) => {
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const streamingContainerRef = useRef<HTMLDivElement>(null);

  // ストリーミング中は自動スクロールで最新内容を表示
  useEffect(() => {
    if (isStreaming && streamingContainerRef.current) {
      streamingContainerRef.current.scrollTop = streamingContainerRef.current.scrollHeight;
    }
  }, [isStreaming, result]);

  const handleSelectShop = async (shop: Shop) => {
    if (onSelectShop) {
      setSelectedShop(shop);
      await onSelectShop(shop);
    }
  };

  // ストリーミング中でもまだ結果がない場合のみローディング表示
  if (isLoading && !result) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-4" />
        <p className="text-sm text-gray-600">情報を検索中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          検索結果
          {isStreaming && (
            <span className="inline-flex items-center gap-1 text-xs text-violet-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              取得中...
            </span>
          )}
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          {isStreaming
            ? "AIが情報を検索しています。完了後に自動保存されます。"
            : "AIが関連情報を検索しました。この内容は自動的に保存されています。"}
        </p>
      </div>

      {/* ストリーミング中はMarkdownをリアルタイム表示 */}
      {isStreaming && result && (
        <div
          ref={streamingContainerRef}
          className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto"
        >
          <MarkdownRenderer content={result} />
        </div>
      )}

      {/* ステータスメッセージ表示（JSONパース中など） */}
      {isStreaming && statusMessage && (
        <div className="flex items-center gap-2 text-sm text-violet-600 bg-violet-50 rounded-lg px-4 py-3">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* ストリーミング完了後: お店候補リストがある場合は表示 */}
      {!isStreaming && shopCandidates && shopCandidates.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            お店を選択してください
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {shopCandidates.map((shop, index) => (
              <ShopCard
                key={`${shop.name}-${index}`}
                shop={shop}
                isSelected={selectedShop?.name === shop.name}
                isSelecting={isSelectingShop && selectedShop?.name === shop.name}
                onSelect={() => handleSelectShop(shop)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ストリーミング完了後: 検索結果が0件の場合 */}
      {!isStreaming && (!shopCandidates || shopCandidates.length === 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800 font-medium mb-1">
            お店候補が見つかりませんでした
          </p>
          <p className="text-xs text-amber-600">
            AIによる検索支援が難しい予定のようです。ご自身で情報を調べていただくか、予定の内容を変更してお試しください。
          </p>
        </div>
      )}

      {/* ストリーミング完了後: Markdown形式の詳細情報 */}
      {!isStreaming && (
        <details className="group" open={!shopCandidates?.length}>
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            詳細情報を表示
          </summary>
          <div className="mt-2 bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <MarkdownRenderer content={result} />
          </div>
        </details>
      )}

      <div className="flex justify-end gap-2 pt-4">
        {/* 0件の場合は「終了する」ボタンのみ（戻って検索し直しても同じ結果になる可能性が高い） */}
        {!isStreaming && (!shopCandidates || shopCandidates.length === 0) ? (
          <Button onClick={onClose}>
            終了する
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onBack} disabled={isStreaming}>
              戻る
            </Button>
            <Button onClick={onClose}>
              {isStreaming ? "中断して閉じる" : "閉じる"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
