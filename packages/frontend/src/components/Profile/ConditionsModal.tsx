import { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { useProfile } from "@/hooks/useProfile";
import type { UpdateProfileConditionsRequest } from "@ai-scheduler/shared";

type ConditionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ConditionFieldProps = {
  label: string;
  description: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

const ConditionField = ({
  label,
  description,
  placeholder,
  value,
  onChange,
}: ConditionFieldProps) => (
  <div className="space-y-2">
    <div>
      <label className="block text-sm font-medium text-gray-900">{label}</label>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
    />
  </div>
);

export const ConditionsModal = ({ isOpen, onClose }: ConditionsModalProps) => {
  const { profile, isLoading, error, updateConditions } = useProfile();
  const [requiredConditions, setRequiredConditions] = useState("");
  const [preferredConditions, setPreferredConditions] = useState("");
  const [subjectiveConditions, setSubjectiveConditions] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // プロファイルが読み込まれたら状態を更新
  useEffect(() => {
    if (profile) {
      setRequiredConditions(profile.requiredConditions);
      setPreferredConditions(profile.preferredConditions);
      setSubjectiveConditions(profile.subjectiveConditions);
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const updates: UpdateProfileConditionsRequest = {
        requiredConditions,
        preferredConditions,
        subjectiveConditions,
      };
      await updateConditions(updates);
      onClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // プロファイルの状態にリセット
    if (profile) {
      setRequiredConditions(profile.requiredConditions);
      setPreferredConditions(profile.preferredConditions);
      setSubjectiveConditions(profile.subjectiveConditions);
    }
    setSaveError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="こだわり条件設定" size="md">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error.message}</p>
          <Button variant="secondary" onClick={handleClose} className="mt-4">
            閉じる
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            ここで設定した条件は、AI検索時に自動的に考慮されます。
          </p>

          <ConditionField
            label="必須条件"
            description="口コミで違反が見つかれば絶対に除外します"
            placeholder="例）甲殻類アレルギー、禁煙必須"
            value={requiredConditions}
            onChange={setRequiredConditions}
          />

          <ConditionField
            label="優先条件"
            description="該当する候補を優先して表示します"
            placeholder="例）駐車場あり、子連れOK"
            value={preferredConditions}
            onChange={setPreferredConditions}
          />

          <ConditionField
            label="重視するポイント"
            description="口コミを確認して評価します"
            placeholder="例）清潔感、口コミ評価が高い"
            value={subjectiveConditions}
            onChange={setSubjectiveConditions}
          />

          {saveError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {saveError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={handleClose}>
              キャンセル
            </Button>
            <Button onClick={handleSave} isLoading={isSaving}>
              保存
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
