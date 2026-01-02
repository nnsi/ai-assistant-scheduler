# Codex Code Review Results

Codex MCPによるコードベースの包括的レビュー結果です。

## High Priority

### 1. 入力バリデーションの不備 (NaN問題)

**対象ファイル:**
- `packages/backend/src/feature/schedule/route.ts:54`
- `packages/backend/src/feature/schedule/usecase/getSchedules.ts:6`
- `packages/backend/src/infra/drizzle/scheduleRepo.ts:13`

**問題:**
入力バリデーションの穴で `NaN` が通り、`toISOString()` で例外が発生し500エラーになる恐れがある。

**推奨修正:**
`z.coerce.number().int().refine(...)` で年・月を厳格化し、`getSchedules` 側も try/catch で `DATABASE_ERROR` を返す設計に揃える。

---

### 2. タイムゾーンの不整合

**対象ファイル:**
- `packages/frontend/src/components/Schedule/ScheduleForm.tsx:30`
- `packages/backend/src/infra/drizzle/scheduleRepo.ts:13`
- `packages/shared/src/schemas/schedule.ts:6`

**問題:**
タイムゾーンの取り扱いが一貫せず、月次検索が境界でズレる可能性がある。

**推奨修正:**
保存時にUTCへ正規化する、またはDBにUTCタイムスタンプで保存してクエリ側もUTC基準に合わせる。

---

### 3. トランザクション未保護

**対象ファイル:**
- `packages/backend/src/feature/schedule/usecase/createSchedule.ts:17`
- `packages/backend/src/feature/supplement/usecase/saveSupplement.ts:18`

**問題:**
予定と補足の保存がトランザクションで保護されておらず、部分的に成功した状態が残る可能性がある。補足保存はDB例外のラップもない。

**推奨修正:**
D1のトランザクションを使うか、補足の失敗をResultに返して整合性を明示的に扱う。

---

### 4. 認証/レート制限の欠如

**対象ファイル:**
- `packages/backend/src/route.ts:14`
- `packages/backend/src/feature/ai/route.ts:23`

**問題:**
認証/レート制限が見当たらずAPIが無制限公開状態。

**推奨修正:**
公開前提でなければ、認証ミドルウェア＋AIエンドポイントのレート制限を必須にする。

---

## Medium/Low Priority

### 5. スキーマのバリデーション不足

**対象ファイル:**
- `packages/shared/src/schemas/schedule.ts:4`
- `packages/shared/src/schemas/schedule.ts:9`
- `packages/shared/src/schemas/supplement.ts:4`

**問題:**
- `endAt >= startAt` が保証されていない
- `aiResult/keywords` のサイズ制限がない

**推奨修正:**
`superRefine` で整合性チェック、`keywords` の件数/文字数上限、`aiResult` の最大長を追加。

---

### 6. フロントエンドAPIクライアントの問題

**対象ファイル:**
- `packages/frontend/src/lib/api.ts:36`
- `packages/frontend/src/lib/api.ts:109`
- `packages/frontend/src/lib/api.ts:154`

**問題:**
- `res.json()` 前提で、非JSONレスポンス時に例外が握り潰される
- `deleteSchedule` と `updateMemo` が同じエラーパースを重複実装している

**推奨修正:**
JSONパース失敗時のフォールバックと、`void` レスポンス用の共通ハンドラ化。

---

### 7. 更新APIの型定義問題

**対象ファイル:**
- `packages/frontend/src/hooks/useSchedules.ts:33`

**問題:**
更新APIの型が `Partial<CreateScheduleInput>` で、`UpdateScheduleInput` との差異を取りこぼす。

**推奨修正:**
`UpdateScheduleInput` へ差し替える。

---

### 8. ページネーション未実装

**対象ファイル:**
- `packages/backend/src/infra/drizzle/scheduleRepo.ts:8`

**問題:**
取得APIが全件取得のみで、データ増加時にパフォーマンス劣化する。

**推奨修正:**
`limit/offset` か期間ベースのページングを追加。

---

## Test Coverage

### 未テストのユースケース

- `packages/backend/src/feature/schedule/usecase/updateSchedule.ts`
- `packages/backend/src/feature/schedule/usecase/deleteSchedule.ts`
- `packages/backend/src/feature/supplement/usecase/updateMemo.ts`
- `packages/backend/src/feature/ai/usecase/searchWithKeywords.ts`

### フロントエンド

- E2Eのみでロジック系のユニットテストがない
- APIクライアントとフックの失敗系をカバーすべき

---

## 質問/前提確認

- スケジュールとAI検索結果は「公開前提」か？個人情報として扱うなら、認証・認可の導入を優先度高で入れるべき。

---

## 批判的検討結果

### 修正対象として採用

| # | 指摘 | 理由 |
|---|------|------|
| 1 | 入力バリデーションの不備 (NaN問題) | `parseInt`の結果がNaNになると`toISOString()`で例外発生。実際にクラッシュする可能性が高い |
| 5 | スキーマのバリデーション不足 | `endAt >= startAt`チェックは論理的整合性を保証するために必要。コスト低で効果高 |
| 6 | フロントエンドAPIクライアントの重複 | DRY原則違反。共通化でメンテナンス性向上 |
| 7 | 更新APIの型定義問題 | `Partial<CreateScheduleInput>` と `UpdateScheduleInput` の不整合は型安全性を損なう |

### 今回は見送り

| # | 指摘 | 理由 |
|---|------|------|
| 2 | タイムゾーンの不整合 | 修正範囲が広く、既存データとの互換性も考慮必要。別タスクとして扱うべき |
| 3 | トランザクション未保護 | D1のバッチ処理対応にはRepo層の設計変更が必要。影響範囲が大きい |
| 4 | 認証/レート制限の欠如 | アプリケーションの用途に依存。開発/プライベート環境では必須ではない |
| 8 | ページネーション未実装 | 現時点のデータ量では問題なし。将来的な課題として認識 |

### テストカバレッジ

指摘は妥当だが、今回のスコープ外。バリデーション修正と合わせてテスト追加を検討すべき。

---

## 実施した修正

### 1. 入力バリデーション改善（NaN対策）

**ファイル:** `packages/backend/src/feature/schedule/route.ts`

- `year`パラメータに `refine()` を追加: 1〜9999の整数のみ許可
- `month`パラメータに `refine()` を追加: 1〜12の整数のみ許可
- GET /schedules にもバリデーションエラーハンドラを追加

### 2. スキーマバリデーション強化

**ファイル:** `packages/shared/src/schemas/schedule.ts`

- `superRefine()` で `endAt >= startAt` の整合性チェックを追加
- `keywords`: 各キーワード50文字以内、最大10個の制限を追加
- `aiResult`: 最大10000文字の制限を追加

### 3. フロントエンドAPIクライアントのリファクタリング

**ファイル:** `packages/frontend/src/lib/api.ts`

- `handleErrorResponse()` 関数を新規作成（エラーパースの共通化）
- `handleVoidResponse()` 関数を新規作成（204 No Content用）
- `deleteSchedule` と `updateMemo` の重複コードを解消
- 非JSONレスポンス時のエラーハンドリングを改善

### 4. 型定義修正

**ファイル:** `packages/frontend/src/hooks/useSchedules.ts`

- `update` メソッドの引数型を `Partial<CreateScheduleInput>` → `UpdateScheduleInput` に修正

---

## 検証結果

- TypeScript型チェック: **PASS** (backend, frontend)
- テスト: **31 passed** (backend)
