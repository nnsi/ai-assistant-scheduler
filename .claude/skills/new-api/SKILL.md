---
name: new-api
description: 新しいAPIエンドポイント/featureを追加する際のガイド。コード生成ツールの使用とチェックリスト。
---

# 新規API開発ガイド

新しいfeature/APIエンドポイントを追加する際の手順とチェックリスト。

## 開発フロー概要

```
1. 設計    → 何を作るか明確にする（エンティティ、API仕様）
2. 生成    → pnpm generate でボイラープレート作成
3. スキーマ → shared/backend両方にスキーマ定義
4. 実装    → 生成されたTODOを埋める、ビジネスロジック追加
5. テスト  → helpers.tsにテストDB追加、テスト実行
6. 確認    → typecheck, build, 動作確認
```

## 1. 設計フェーズ

新機能を実装する前に以下を明確にする：

### エンティティ設計
- どのようなデータを扱うか（フィールド、型）
- 他のエンティティとの関係（user_id、calendar_idなど）
- 必須/任意フィールドの区別

### API仕様
- エンドポイントパス（例: `/reminders`）
- 必要なCRUD操作（全部必要か、一部だけか）
- 認証の要否
- 特殊なクエリ（findByXxx など）

## 2. コード生成ツールでボイラープレートを作成

```bash
pnpm generate feature -- --name <feature-name>
```

**生成されるファイル**:
- `domain/infra/<name>Repo.ts` - Repository Interface
- `infra/drizzle/<name>Repo.ts` - Drizzle Implementation
- `feature/<name>/route.ts` - Hono CRUD Route
- `feature/<name>/usecase/*.ts` - Create, GetAll, Update, Delete

## 3. スキーマ定義とファイル作成

### Shared Package
- [ ] `packages/shared/src/schemas/<name>.ts` にZodスキーマを作成
  - `create<Name>InputSchema`
  - `update<Name>InputSchema`
  - `<Name>` (レスポンス型)
- [ ] `packages/shared/src/index.ts` からexport

### Backend Schema
- [ ] `packages/backend/src/infra/drizzle/schema.ts` にテーブル定義追加
- [ ] `packages/backend/src/domain/model/<name>.ts` にエンティティ・ファクトリ関数作成
- [ ] `packages/backend/src/infra/drizzle/<name>Repo.ts` の `toEntity`/`toRow` を実装

### Route Registration
- [ ] `packages/backend/src/route.ts` にルート登録:
```typescript
import { <name>Route } from "./feature/<name>/route";
// ...
.route("/<name>s", <name>Route)
```

### Test DB Schema
- [ ] `packages/backend/test/helpers.ts` の `createTestDb` にテーブル追加
  - 本番スキーマと完全に同期させること

### Migration
- [ ] `pnpm db:generate` でマイグレーション生成
- [ ] `pnpm db:migrate` でローカルDB更新

## 4. 実装のポイント

### 日時の扱い
- `toISOString()` はUTC変換されるため、ローカル日付が必要な場面では使わない
- 日付文字列が必要な場合は `date-fns` の `format(date, "yyyy-MM-dd")` を使う
- Zodの `datetime()` はデフォルトでUTCのみ。JSTを受け付けるなら `{ offset: true }` が必要

### 型安全性
- `as` による型アサーションは使わない
- APIレスポンスはZodスキーマで `safeParse` してから使う
- sharedパッケージにスキーマがあるならそれを再利用する

### 認証が必要な場合
- CORSの `allowHeaders` に `Authorization` を追加したか確認
- 既存のリソース系テーブルに `user_id` が必要か検討
- 既存テストへの影響範囲を `grep` で事前調査

### E2Eテストのモック
- 新しいAPIエンドポイントを追加したら、E2Eテストに対応するモックを追加
- Zodスキーマの必須フィールドがモックに全て含まれているか確認
- `nullable` と `optional` の違いに注意（`null` vs `undefined`）

## 5. テスト実行

```bash
# バックエンドテスト
pnpm --filter backend test

# 型チェック
pnpm typecheck

# ビルド確認
pnpm build
```

## 6. 完了確認

- [ ] 生成されたコードが既存パターンと一貫している
- [ ] テストが通る
- [ ] 型エラーがない
- [ ] 不要なtry-catchを追加していない（Result型パターンを使用）
