# タスクリスト

## Phase 1: 環境構築

- [ ] 1.1 pnpm workspace セットアップ
  - [ ] `pnpm-workspace.yaml` 作成
  - [ ] ルート `package.json` 作成
- [ ] 1.2 shared パッケージ作成
  - [ ] `packages/shared/package.json`
  - [ ] `packages/shared/tsconfig.json`
  - [ ] Zod スキーマ（schedule, supplement, ai, errors）
- [ ] 1.3 backend パッケージ作成
  - [ ] `packages/backend/package.json`
  - [ ] `packages/backend/tsconfig.json`
  - [ ] `packages/backend/wrangler.toml`
  - [ ] Hono エントリポイント（`src/index.ts`）
- [ ] 1.4 frontend パッケージ作成
  - [ ] `packages/frontend/package.json`
  - [ ] `packages/frontend/tsconfig.json`
  - [ ] `packages/frontend/vite.config.ts`
  - [ ] `packages/frontend/tailwind.config.ts`
  - [ ] React エントリポイント
- [ ] 1.5 D1 データベースセットアップ
  - [ ] Drizzle schema 作成
  - [ ] `drizzle.config.ts`
  - [ ] マイグレーションファイル生成
  - [ ] ローカル D1 で動作確認

## Phase 2: API構築

- [ ] 2.1 ドメイン層
  - [ ] `domain/model/schedule.ts`（Entity + Zod schema）
  - [ ] `domain/model/supplement.ts`
  - [ ] `domain/infra/scheduleRepo.ts`（型定義）
  - [ ] `domain/infra/supplementRepo.ts`（型定義）
  - [ ] `domain/infra/aiService.ts`（型定義）
- [ ] 2.2 インフラ層
  - [ ] `infra/drizzle/schema.ts`
  - [ ] `infra/drizzle/scheduleRepo.ts`
  - [ ] `infra/drizzle/supplementRepo.ts`
  - [ ] `infra/mastra/agents.ts`
  - [ ] `infra/mastra/aiService.ts`
- [ ] 2.3 共有ユーティリティ
  - [ ] `shared/errors.ts`（AppError, Result型）
  - [ ] `shared/id.ts`（nanoid）
  - [ ] `shared/http.ts`（getStatusCode）
- [ ] 2.4 Feature: Schedule
  - [ ] `feature/schedule/usecase/createSchedule.ts`
  - [ ] `feature/schedule/usecase/getSchedules.ts`
  - [ ] `feature/schedule/usecase/getScheduleById.ts`
  - [ ] `feature/schedule/usecase/updateSchedule.ts`
  - [ ] `feature/schedule/usecase/deleteSchedule.ts`
  - [ ] `feature/schedule/handler/*`（各ハンドラ）
  - [ ] `feature/schedule/route.ts`（DI + ルート）
- [ ] 2.5 Feature: Supplement
  - [ ] `feature/supplement/usecase/saveSupplement.ts`
  - [ ] `feature/supplement/usecase/updateMemo.ts`
  - [ ] `feature/supplement/handler/*`
  - [ ] `feature/supplement/route.ts`
- [ ] 2.6 Feature: AI
  - [ ] `feature/ai/usecase/suggestKeywords.ts`
  - [ ] `feature/ai/usecase/searchWithKeywords.ts`
  - [ ] `feature/ai/handler/*`
  - [ ] `feature/ai/route.ts`
- [ ] 2.7 ルート集約
  - [ ] `src/route.ts`（各 feature を束ねる）
  - [ ] CORS設定

## Phase 3: APIテスト

- [ ] 3.1 テスト環境セットアップ
  - [ ] `vitest.config.ts`
  - [ ] テスト用ユーティリティ
- [ ] 3.2 UseCase 単体テスト
  - [ ] `createSchedule.test.ts`
  - [ ] `getSchedules.test.ts`
  - [ ] `suggestKeywords.test.ts`
  - [ ] その他 UseCase
- [ ] 3.3 Handler 単体テスト
  - [ ] バリデーションエラーケース
  - [ ] 正常系
- [ ] 3.4 統合テスト
  - [ ] Schedule API（CRUD）
  - [ ] AI API（キーワード提案、検索）
  - [ ] Supplement API

## Phase 4: フロントエンド構築

- [ ] 4.1 共通基盤
  - [ ] `lib/api.ts`（APIクライアント）
  - [ ] `lib/cn.ts`（className結合）
  - [ ] `lib/date.ts`（date-fns ラッパー）
  - [ ] `env.ts`（環境変数）
- [ ] 4.2 共通コンポーネント
  - [ ] `components/common/Button.tsx`
  - [ ] `components/common/Modal.tsx`
  - [ ] `components/common/MarkdownRenderer.tsx`
- [ ] 4.3 カレンダーコンポーネント
  - [ ] `components/Calendar/CalendarHeader.tsx`
  - [ ] `components/Calendar/CalendarDay.tsx`
  - [ ] `components/Calendar/Calendar.tsx`
- [ ] 4.4 スケジュールコンポーネント
  - [ ] `components/Schedule/ScheduleForm.tsx`
  - [ ] `components/Schedule/ScheduleDetail.tsx`
  - [ ] `components/Schedule/SchedulePopup.tsx`
- [ ] 4.5 AIコンポーネント
  - [ ] `components/AI/KeywordSuggestions.tsx`
  - [ ] `components/AI/SearchResults.tsx`
- [ ] 4.6 カスタムフック
  - [ ] `hooks/useSchedules.ts`
  - [ ] `hooks/useAI.ts`
- [ ] 4.7 アプリ統合
  - [ ] `App.tsx`（状態管理、画面構成）
  - [ ] スタイル調整

## Phase 5: E2Eテスト

- [ ] 5.1 Playwright セットアップ
  - [ ] `playwright.config.ts`
  - [ ] テスト用環境構築
- [ ] 5.2 主要フローテスト
  - [ ] 予定作成フロー（タイトル入力 → キーワード選択 → 検索 → 保存）
  - [ ] 予定閲覧フロー（カレンダー表示 → 予定クリック → 詳細表示）
  - [ ] 予定編集・削除フロー
  - [ ] メモ追記フロー

---

## 備考

- 各タスクは完了時にチェックを入れる
- 問題が発生した場合は該当タスクにコメントを追記
- Phase 間の移行時に動作確認を行う
