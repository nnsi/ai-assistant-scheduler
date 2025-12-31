import { Loader2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";

type SearchResultsProps = {
  result: string;
  isLoading?: boolean;
  onSave: () => void;
  onBack: () => void;
};

export const SearchResults = ({
  result,
  isLoading = false,
  onSave,
  onBack,
}: SearchResultsProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-4" />
        <p className="text-sm text-gray-600">情報を検索中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">検索結果</h3>
        <p className="text-xs text-gray-500 mb-4">
          AIが関連情報を検索しました。この内容で保存しますか？
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
        <MarkdownRenderer content={result} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="secondary" onClick={onBack}>
          戻る
        </Button>
        <Button onClick={onSave}>保存する</Button>
      </div>
    </div>
  );
};
