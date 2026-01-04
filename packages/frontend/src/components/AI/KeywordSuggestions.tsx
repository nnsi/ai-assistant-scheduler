import { useState } from "react";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/cn";

type KeywordSuggestionsProps = {
  keywords: string[];
  isLoading?: boolean;
  isSearching?: boolean;
  isRegenerating?: boolean;
  hasConditions?: boolean;
  onSelect: (keywords: string[]) => void;
  onSkip: () => void;
  onRegenerate?: () => void;
};

export const KeywordSuggestions = ({
  keywords,
  isLoading = false,
  isSearching = false,
  isRegenerating = false,
  hasConditions = false,
  onSelect,
  onSkip,
  onRegenerate,
}: KeywordSuggestionsProps) => {
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(
    new Set()
  );

  const toggleKeyword = (keyword: string) => {
    const newSet = new Set(selectedKeywords);
    if (newSet.has(keyword)) {
      newSet.delete(keyword);
    } else {
      newSet.add(keyword);
    }
    setSelectedKeywords(newSet);
  };

  const handleSelect = () => {
    onSelect(Array.from(selectedKeywords));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-4" />
        <p className="text-sm text-gray-600">キーワードを提案中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          調べたいことを選択してください
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          AIが予定に関連するキーワードを提案しました。気になる項目を選択してください。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword) => {
          const isSelected = selectedKeywords.has(keyword);
          return (
            <button
              key={keyword}
              onClick={() => toggleKeyword(keyword)}
              className={cn(
                "inline-flex items-center px-3 py-1.5 rounded-full text-sm transition-colors",
                isSelected
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {isSelected && <Check className="w-4 h-4 mr-1" />}
              {keyword}
            </button>
          );
        })}
      </div>

      {onRegenerate && (
        <button
          onClick={onRegenerate}
          disabled={isRegenerating || isSearching}
          className={cn(
            "inline-flex items-center gap-1.5 text-sm transition-colors",
            isRegenerating || isSearching
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-500 hover:text-primary-600"
          )}
        >
          <RefreshCw className={cn("w-4 h-4", isRegenerating && "animate-spin")} />
          {isRegenerating ? "提案中..." : "別のキーワードを提案してもらう"}
        </button>
      )}

      {hasConditions && selectedKeywords.size === 0 && (
        <p className="text-xs text-primary-600">
          こだわり条件が設定されているため、キーワード未選択でも検索できます
        </p>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="secondary"
          onClick={onSkip}
          disabled={isSearching || isRegenerating}
        >
          スキップ
        </Button>
        <Button
          onClick={handleSelect}
          disabled={(selectedKeywords.size === 0 && !hasConditions) || isRegenerating}
          isLoading={isSearching}
        >
          {isSearching ? "検索中..." : `検索する (${selectedKeywords.size}件選択中)`}
        </Button>
      </div>
    </div>
  );
};
