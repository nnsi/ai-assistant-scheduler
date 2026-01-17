import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { useCategories } from "@/hooks/useCategories";
import { cn } from "@/lib/cn";
import { CATEGORY_COLORS, type Category } from "@ai-scheduler/shared";
import { useState } from "react";

type CategoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const CategoryModal = ({ isOpen, onClose }: CategoryModalProps) => {
  const { categories, create, update, remove, isLoading } = useCategories();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setColor(CATEGORY_COLORS[0]);
    setEditingCategory(null);
    setIsCreating(false);
    setError(null);
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingCategory(null);
    setName("");
    setColor(CATEGORY_COLORS[0]);
    setError(null);
  };

  const handleStartEdit = (category: Category) => {
    setEditingCategory(category);
    setIsCreating(false);
    setName(category.name);
    setColor(category.color);
    setError(null);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      if (editingCategory) {
        await update(editingCategory.id, { name: name.trim(), color });
      } else {
        await create({ name: name.trim(), color });
      }
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    setError(null);
    try {
      await remove(id);
      if (editingCategory?.id === id) {
        resetForm();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isEditing = editingCategory !== null || isCreating;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="カテゴリ管理" size="md">
      <div className="space-y-4">
        {/* カテゴリ一覧 */}
        {!isEditing && (
          <>
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-4 text-stone-500">読み込み中...</div>
              ) : categories.length === 0 ? (
                <div className="text-center py-4 text-stone-500">カテゴリがありません</div>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer"
                    onClick={() => handleStartEdit(category)}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="flex-1 text-stone-800">{category.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(category.id);
                      }}
                      disabled={isDeleting}
                      className="text-stone-400 hover:text-red-500 transition-colors p-1"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                <span className="text-sm text-red-700">{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="ml-2 text-red-500 hover:text-red-700"
                  aria-label="エラーを閉じる"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
              <Button variant="ghost" onClick={handleClose}>
                閉じる
              </Button>
              <Button onClick={handleStartCreate}>新規作成</Button>
            </div>
          </>
        )}

        {/* 編集・作成フォーム */}
        {isEditing && (
          <>
            <div>
              <label
                htmlFor="category-name"
                className="block text-sm font-medium text-stone-700 mb-2"
              >
                カテゴリ名
              </label>
              <input
                id="category-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 仕事、プライベート"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border bg-white",
                  "text-stone-800 placeholder:text-stone-400",
                  "transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
                  "border-stone-200"
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">カラー</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      color === c
                        ? "ring-2 ring-offset-2 ring-stone-400 scale-110"
                        : "hover:scale-105"
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`色 ${c}`}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                <span className="text-sm text-red-700">{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="ml-2 text-red-500 hover:text-red-700"
                  aria-label="エラーを閉じる"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
              <Button variant="ghost" onClick={handleCancel}>
                キャンセル
              </Button>
              <Button onClick={handleSave} isLoading={isSaving} disabled={!name.trim()}>
                {editingCategory ? "更新" : "作成"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
