# フロントエンド エラーハンドリング レビューレポート

**作成日**: 2026-01-18
**レビュアー**: codebase-explorer, security-reviewer, Codex
**ステータス**: 全項目対応完了

---

## 概要

フロントエンドのエラーハンドリングについてレビューを実施し、全ての改善項目を完了した。

---

## 対応完了（High優先度）

### 1. AppError / ApiClientError の統一 ✅

**変更ファイル**:
- `packages/core/src/api/client.ts`
- `packages/core/src/utils/errorHandler.ts`

**実施内容**:
- `ApiClientError.code` の型を `AppErrorCode` に変更
- `mapBackendCodeToAppErrorCode()` 関数を追加し、バックエンドのエラーコードを適切にマッピング
- `toAppError()` で `ApiClientError` を直接処理するように改善
- `isApiClientError()` 型ガードを追加

---

### 2. サイレント失敗の修正 ✅

| # | 問題 | 対応内容 |
|---|------|---------|
| 1 | スケジュール作成失敗 | `useScheduleFormModal.ts` に `error` 状態と `clearError` を追加。`ScheduleFormModal.tsx` でエラー表示UI実装 |
| 2 | スケジュール編集失敗 | `ScheduleEditModal.tsx` に `error` 状態とエラー表示UI実装 |
| 3 | カレンダー作成失敗 | `CalendarCreateModal.tsx` に `error` 状態とtry/catchによるエラーハンドリング実装 |
| 4 | カテゴリ作成/更新失敗 | `CategoryModal.tsx` に `error` 状態とtry/catchによるエラーハンドリング実装 |
| 5 | 繰り返しルール作成失敗 | `useScheduleFormModal.ts` のエラーハンドリングで対応済み |

---

### 3. エラー表示UIの統一 ✅

全てのエラー表示に以下のパターンを適用:
- 赤い背景（`bg-red-50`）とボーダー（`border-red-200`）
- エラークローズボタン（×アイコン）
- 失敗時はモーダルを閉じず入力データを保持

---

## 対応完了（Medium/Low優先度）

### 6. エラー通知の表示時間改善 ✅

**変更ファイル**: `packages/frontend/src/components/MainApp.tsx`

**実施内容**:
- エラー通知（type: "error"）: 10秒表示
- 成功通知（type: "success"）: 5秒表示（従来通り）
- 閉じるボタン: 既存実装を維持

---

### 7. AI検索エラーのUI表示 ✅

**変更ファイル**:
- `packages/core/src/hooks/useAI.ts` - `clearError` 関数追加
- `packages/core/src/hooks/useScheduleFormModal.ts` - `aiError`, `clearAiError` 公開
- `packages/frontend/src/components/AI/KeywordSuggestions.tsx` - エラー表示UI追加
- `packages/frontend/src/components/AI/SearchResults.tsx` - エラー表示UI追加
- `packages/frontend/src/components/Schedule/ScheduleFormModal.tsx` - エラー状態の連携
- `packages/frontend/src/components/Schedule/SchedulePopup.tsx` - エラー状態の連携

**実施内容**:
- 検索失敗時に「検索に失敗しました。再度お試しください。」を表示
- 他のモーダルと同様のエラー表示スタイル

---

### 8. エラーメッセージの改善 ✅

**変更ファイル**: `packages/core/src/utils/errorHandler.ts`

**実施内容**: `getMessageForCode()` で次のアクションを含むメッセージに改善

| コード | メッセージ |
|--------|-----------|
| NETWORK_ERROR | ネットワークに接続できませんでした。インターネット接続を確認して、再度お試しください。 |
| AUTH_ERROR | ログインの有効期限が切れました。お手数ですが、再度ログインしてください。 |
| NOT_FOUND | お探しのデータが見つかりませんでした。削除された可能性があります。一覧画面に戻って確認してください。 |
| SERVER_ERROR | サーバーで問題が発生しました。しばらく時間をおいてから再度お試しください。問題が続く場合はサポートにお問い合わせください。 |
| VALIDATION_ERROR | 入力内容に誤りがあります。赤く表示されている項目を確認して、修正してください。 |
| UNKNOWN_ERROR | 予期しないエラーが発生しました。ページを再読み込みするか、しばらく時間をおいてから再度お試しください。 |

---

### 9. ログイン失敗後のリダイレクト改善 ✅

**変更ファイル**: `packages/frontend/src/components/Auth/AuthCallback.tsx`

**実施内容**:
- 表示時間を3秒→5秒に延長
- カウントダウン表示を追加（「{n}秒後にログインページにリダイレクトします...」）
- 「ログインページに戻る」ボタンを追加（手動で戻れるように）

---

### 10. ストリーミングエラー時の状態管理改善 ✅

**変更ファイル**: `packages/core/src/hooks/useAI.ts`

**実施内容**:
- エラーイベント受信時に即座に `setIsStreaming(false)`, `setIsLoadingSearch(false)` を呼び出し
- ステータスメッセージもクリア

---

## 良好な実装一覧

| ファイル | 実装内容 |
|---------|---------|
| `MainApp.tsx` | handleScheduleSave/handleScheduleDeleteでnotification表示、表示時間の最適化 |
| `InviteMemberModal.tsx` | エラー種別に応じたメッセージ表示 |
| `InvitationAcceptPage.tsx` | 招待受け入れ失敗時の適切な表示 |
| `ConditionsModal.tsx` | 保存失敗時のsaveError表示 |
| `ScheduleForm.tsx` | Zodスキーマでフォームバリデーション |
| `ScheduleFormModal.tsx` | エラー表示とクローズボタン |
| `ScheduleEditModal.tsx` | エラー表示とクローズボタン |
| `CalendarCreateModal.tsx` | エラー表示とクローズボタン |
| `CategoryModal.tsx` | エラー表示とクローズボタン |
| `KeywordSuggestions.tsx` | AI検索エラー表示 |
| `SearchResults.tsx` | AI検索エラー表示 |
| `AuthCallback.tsx` | カウントダウン付きエラー表示、手動戻りボタン |

---

## 検証結果

- 型チェック: ✅ 全パッケージ通過
- テスト: ✅ 88テスト全て通過（backend: 75, frontend: 13）

---

## 注意事項

- 本レポートはAIレビュアーによる自動生成
- 実装前にコードを直接確認すること
