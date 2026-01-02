# タスクリスト

## Phase 1: 環境構築 ✅

- [x] 1.1 pnpm workspace セットアップ
  - [x] `pnpm-workspace.yaml` 作成
  - [x] ルート `package.json` 作成
- [x] 1.2 shared パッケージ作成
  - [x] `packages/shared/package.json`
  - [x] `packages/shared/tsconfig.json`
  - [x] Zod スキーマ（schedule, supplement, ai, errors）
- [x] 1.3 backend パッケージ作成
  - [x] `packages/backend/package.json`
  - [x] `packages/backend/tsconfig.json`
  - [x] `packages/backend/wrangler.toml`
  - [x] Hono エントリポイント（`src/index.ts`）
- [x] 1.4 frontend パッケージ作成
  - [x] `packages/frontend/package.json`
  - [x] `packages/frontend/tsconfig.json`
  - [x] `packages/frontend/vite.config.ts`
  - [x] `packages/frontend/tailwind.config.ts`
  - [x] React エントリポイント
- [x] 1.5 D1 データベースセットアップ
  - [x] Drizzle schema 作成
  - [x] `drizzle.config.ts`
  - [x] マイグレーションファイル生成
  - [x] 型チェック確認

## Phase 2: API構築 ✅

- [x] 2.1 ドメイン層
  - [x] `domain/model/schedule.ts`（Entity + Zod schema）
  - [x] `domain/model/supplement.ts`
  - [x] `domain/infra/scheduleRepo.ts`（型定義）
  - [x] `domain/infra/supplementRepo.ts`（型定義）
  - [x] `domain/infra/aiService.ts`（型定義）
- [x] 2.2 インフラ層
  - [x] `infra/drizzle/schema.ts`
  - [x] `infra/drizzle/scheduleRepo.ts`
  - [x] `infra/drizzle/supplementRepo.ts`
  - [x] `infra/mastra/agents.ts`
  - [x] `infra/mastra/aiService.ts`
- [x] 2.3 共有ユーティリティ
  - [x] `shared/errors.ts`（AppError, Result型）
  - [x] `shared/id.ts`（nanoid）
  - [x] `shared/http.ts`（getStatusCode）
- [x] 2.4 Feature: Schedule
  - [x] `feature/schedule/usecase/createSchedule.ts`
  - [x] `feature/schedule/usecase/getSchedules.ts`
  - [x] `feature/schedule/usecase/getScheduleById.ts`
  - [x] `feature/schedule/usecase/updateSchedule.ts`
  - [x] `feature/schedule/usecase/deleteSchedule.ts`
  - [x] `feature/schedule/handler/*`（各ハンドラ）
  - [x] `feature/schedule/route.ts`（DI + ルート）
- [x] 2.5 Feature: Supplement
  - [x] `feature/supplement/usecase/saveSupplement.ts`
  - [x] `feature/supplement/usecase/updateMemo.ts`
  - [x] `feature/supplement/handler/*`
  - [x] `feature/supplement/route.ts`
- [x] 2.6 Feature: AI
  - [x] `feature/ai/usecase/suggestKeywords.ts`
  - [x] `feature/ai/usecase/searchWithKeywords.ts`
  - [x] `feature/ai/handler/*`
  - [x] `feature/ai/route.ts`
- [x] 2.7 ルート集約
  - [x] `src/route.ts`（各 feature を束ねる）
  - [x] CORS設定

## Phase 3: APIテスト ✅

- [x] 3.1 テスト環境セットアップ
  - [x] `vitest.config.ts`
  - [x] テスト用ユーティリティ
- [x] 3.2 UseCase 単体テスト
  - [x] `createSchedule.test.ts`
  - [x] `getSchedules.test.ts`
  - [x] `getScheduleById.test.ts`
  - [x] `suggestKeywords.test.ts`
- [ ] 3.3 Handler 単体テスト（MVP後）
- [ ] 3.4 統合テスト（MVP後）

## Phase 4: フロントエンド構築 ✅

- [x] 4.1 共通基盤
  - [x] `lib/api.ts`（APIクライアント）
  - [x] `lib/cn.ts`（className結合）
  - [x] `lib/date.ts`（date-fns ラッパー）
  - [x] `env.ts`（環境変数）
- [x] 4.2 共通コンポーネント
  - [x] `components/common/Button.tsx`
  - [x] `components/common/Modal.tsx`
  - [x] `components/common/MarkdownRenderer.tsx`
- [x] 4.3 カレンダーコンポーネント
  - [x] `components/Calendar/CalendarHeader.tsx`
  - [x] `components/Calendar/CalendarDay.tsx`
  - [x] `components/Calendar/Calendar.tsx`
- [x] 4.4 スケジュールコンポーネント
  - [x] `components/Schedule/ScheduleForm.tsx`
  - [x] `components/Schedule/ScheduleDetail.tsx`
  - [x] `components/Schedule/SchedulePopup.tsx`
  - [x] `components/Schedule/ScheduleFormModal.tsx`
- [x] 4.5 AIコンポーネント
  - [x] `components/AI/KeywordSuggestions.tsx`
  - [x] `components/AI/SearchResults.tsx`
- [x] 4.6 カスタムフック
  - [x] `hooks/useSchedules.ts`
  - [x] `hooks/useAI.ts`
- [x] 4.7 アプリ統合
  - [x] `App.tsx`（状態管理、画面構成）
  - [x] スタイル調整

## Phase 5: E2Eテスト ✅

- [x] 5.1 Playwright セットアップ
  - [x] `playwright.config.ts`
  - [x] テスト用環境構築
- [x] 5.2 主要フローテスト
  - [x] カレンダー表示テスト
  - [x] 月移動テスト
  - [x] 予定作成モーダルテスト
  - [x] フォーム入力テスト
  - [x] モーダルキャンセルテスト
  - [x] 今日ボタンテスト
- [x] 5.3 インテグレーションテスト（ブラウザ実動作確認）
  - [x] フロントエンド・バックエンド疎通確認
  - [x] 予定作成フロー（タイトル入力 → キーワード選択 → 検索 → 保存）
  - [x] モックAIレスポンス確認
- [ ] 5.4 追加テスト（MVP後）
  - [ ] 予定編集・削除フロー
  - [ ] メモ追記フロー
  - [ ] 実AIテスト（OpenRouter連携）

## Phase 6: バグ修正 ✅

- [x] 6.1 Viteプロキシ設定修正
  - [x] `localhost` → `127.0.0.1`（IPv6/IPv4問題）
- [x] 6.2 Zodバリデーション修正
  - [x] `datetime({ offset: true })` を追加（タイムゾーンオフセット対応）
  - [x] `packages/shared/src/schemas/schedule.ts`
  - [x] `packages/shared/src/schemas/ai.ts`
- [x] 6.3 モックAIサービス追加
  - [x] `packages/backend/src/infra/mock/aiService.ts`
  - [x] `USE_MOCK_AI` 環境変数で切り替え

---

## 備考

- 各タスクは完了時にチェックを入れる
- 問題が発生した場合は該当タスクにコメントを追記
- Phase 間の移行時に動作確認を行う
