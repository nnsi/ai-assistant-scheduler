---
name: backend-dev
description: バックエンドAPI開発ガイド。アーキテクチャ、新規/既存API開発、テスト、デバッグ。
---

# バックエンド開発ガイド

バックエンド（Hono/Cloudflare Workers）の開発手順とベストプラクティス。

## アーキテクチャ

```
packages/backend/src/
├── domain/
│   ├── model/       # エンティティ、ファクトリ関数
│   └── infra/       # リポジトリインターフェース
├── feature/         # 機能単位のモジュール
│   └── <name>/
│       ├── route.ts              # Honoルート定義
│       ├── route.integration.test.ts
│       └── usecase/              # ビジネスロジック
│           ├── <action>.ts
│           └── <action>.test.ts
├── infra/
│   ├── drizzle/     # Drizzle ORM実装（リポジトリ、スキーマ）
│   ├── auth/        # 認証インフラ
│   └── mastra/      # AIエージェント
├── middleware/      # Honoミドルウェア
├── shared/          # エラー、Result型、ユーティリティ
└── route.ts         # ルート統合
```

### レイヤーの責務

| レイヤー | 責務 | 依存先 |
|---------|------|--------|
| Route | HTTPハンドリング、バリデーション、DI | Usecase |
| Usecase | ビジネスロジック | Repository (interface) |
| Domain | エンティティ定義、ビジネスルール | なし |
| Infra | 外部サービス実装（DB、AI等） | Domain interface |

## 開発フロー

### 新規API追加

```bash
# ボイラープレート生成
pnpm generate feature -- --name <feature-name>
```

**生成されるファイル**:
- `domain/infra/<name>Repo.ts` - Repository Interface
- `infra/drizzle/<name>Repo.ts` - Drizzle Implementation
- `feature/<name>/route.ts` - Hono CRUD Route
- `feature/<name>/usecase/*.ts` - Create, GetAll, Update, Delete

**必要な追加作業**:
1. `packages/shared/src/schemas/<name>.ts` にZodスキーマ作成
2. `packages/backend/src/infra/drizzle/schema.ts` にテーブル定義
3. `packages/backend/src/domain/model/<name>.ts` にエンティティ作成
4. `packages/backend/src/route.ts` にルート登録
5. `packages/backend/test/helpers.ts` にテストDB追加
6. `pnpm db:generate && pnpm db:migrate` でマイグレーション

### 既存API修正

1. まず関連コードを把握:
   ```bash
   # 機能の全体像を確認
   ls packages/backend/src/feature/<name>/

   # リポジトリインターフェースを確認
   cat packages/backend/src/domain/infra/<name>Repo.ts
   ```

2. 修正箇所の特定:
   - **レスポンス変更** → Usecase + shared/schemas
   - **バリデーション変更** → Route + shared/schemas
   - **DB操作変更** → infra/drizzle/<name>Repo.ts
   - **ビジネスロジック変更** → Usecase

3. テストも更新:
   - `*.test.ts` - ユニットテスト
   - `*.integration.test.ts` - 結合テスト

## コードパターン

### Route層

```typescript
// feature/<name>/route.ts
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 認証が必要な場合
app.use("*", authMiddleware);

// DIミドルウェアでリポジトリをセット
app.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  const repo = createXxxRepo(db);
  c.set("xxxUseCase", createXxxUseCase(repo));
  await next();
});

// ハンドラ
app.post("/", zValidator("json", createXxxInputSchema), async (c) => {
  const input = c.req.valid("json");
  const userId = c.get("userId");
  const result = await c.get("xxxUseCase")(input, userId);

  if (!result.ok) {
    return c.json({ error: result.error }, getStatusCode(result.error.code));
  }
  return c.json(result.value, 201);
});
```

### Usecase層（Result型パターン）

```typescript
// feature/<name>/usecase/<action>.ts
import { type Result, ok, err } from "../../../shared/result";
import { createNotFoundError } from "../../../shared/errors";

export const createXxxUseCase = (repo: XxxRepo) => {
  return async (input: Input, userId: string): Promise<Result<Output>> => {
    try {
      const entity = await repo.findById(input.id);
      if (!entity) {
        return err(createNotFoundError("Xxx"));
      }
      // ビジネスロジック...
      return ok(toPublicXxx(entity));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return err(createDatabaseError(message));
    }
  };
};
```

### Domain層

```typescript
// domain/model/<name>.ts
export type Xxx = {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

// ファクトリ関数（IDはここで生成）
export const createXxx = (input: CreateXxxInput, userId: string): Xxx => ({
  id: crypto.randomUUID(),
  userId,
  name: input.name,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 公開用変換（内部フィールドを除外など）
export const toPublicXxx = (entity: Xxx): PublicXxx => ({
  id: entity.id,
  name: entity.name,
  // ...
});
```

### Repository層

```typescript
// domain/infra/<name>Repo.ts（インターフェース）
export type XxxRepo = {
  save: (entity: Xxx) => Promise<void>;
  findById: (id: string) => Promise<Xxx | null>;
  findByUserId: (userId: string) => Promise<Xxx[]>;
  update: (entity: Xxx) => Promise<void>;
  delete: (id: string) => Promise<void>;
};

// infra/drizzle/<name>Repo.ts（実装）
export const createXxxRepo = (db: DrizzleD1Database): XxxRepo => ({
  save: async (entity) => {
    await db.insert(xxxTable).values(toRow(entity));
  },
  findById: async (id) => {
    const row = await db.select().from(xxxTable).where(eq(xxxTable.id, id)).get();
    return row ? toEntity(row) : null;
  },
  // ...
});

// 変換関数
const toEntity = (row: typeof xxxTable.$inferSelect): Xxx => ({ ... });
const toRow = (entity: Xxx): typeof xxxTable.$inferInsert => ({ ... });
```

## テスト

### テストDBスキーマの同期（重要）

**本番スキーマを変更したら、必ず `test/helpers.ts` の `createTestDb` も更新する。**

変更するべきファイル:
- `packages/backend/src/infra/drizzle/schema.ts` → 本番スキーマ
- `packages/backend/test/helpers.ts` → テスト用スキーマ（同期必須）

よくある失敗パターン:
1. 新しいテーブルやカラムを追加
2. 本番は動くがテストが落ちる
3. 原因は `createTestDb` にテーブル/カラムがない

### テスト実行

```bash
# バックエンドテストのみ
pnpm --filter backend test

# 特定のテストファイル
pnpm --filter backend test <path>

# 型チェック
pnpm typecheck

# ビルド確認
pnpm build
```

### ユニットテストの書き方

```typescript
// feature/<name>/usecase/<action>.test.ts
import { describe, it, expect, vi } from "vitest";

describe("createXxxUseCase", () => {
  it("正常系", async () => {
    const mockRepo = {
      save: vi.fn(),
      findById: vi.fn(),
    };
    const usecase = createXxxUseCase(mockRepo);

    const result = await usecase({ name: "test" }, "user-1");

    expect(result.ok).toBe(true);
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
```

## Cloudflare Workers固有の制約

- `process`オブジェクトが存在しない（`globalThis`で代替）
- `better-sqlite3`はテスト用のみ。本番はD1を使用
- SSEは100秒間イベントなしで524エラー
- `vitest-pool-workers`はMastraの依存で動かない場合がある

## 認証機能を追加するとき

- CORSの`allowHeaders`に`Authorization`を追加したか確認
- 既存のリソース系テーブルに`user_id`が必要か検討
- 既存テストへの影響範囲を`grep`で事前調査

## 日時の扱い

- `toISOString()`はUTC変換されるため、ローカル日付が必要な場面では使わない
- 日付文字列が必要な場合は`date-fns`の`format(date, "yyyy-MM-dd")`を使う
- Zodの`datetime()`はデフォルトでUTCのみ。JSTを受け付けるなら`{ offset: true }`が必要

## 型安全性

- `as`による型アサーションは使わない
- APIレスポンスはZodスキーマで`safeParse`してから使う
- sharedパッケージにスキーマがあるならそれを再利用する

## デバッグ

### APIが期待通り動かないとき

1. **リクエスト確認**: バリデーションエラーが出ていないか
2. **Usecase確認**: Result型のerrが返っていないか
3. **DB確認**: Drizzle Studioで直接データを確認
   ```bash
   pnpm drizzle-kit studio
   ```

### テストが落ちるとき

1. **スキーマ同期**: `test/helpers.ts`と本番スキーマが一致しているか
2. **モックの戻り値**: 期待する型を返しているか
3. **非同期処理**: awaitを忘れていないか

## 完了チェックリスト

### 新規API
- [ ] shared/schemasにZodスキーマを作成しexport
- [ ] drizzle/schema.tsにテーブル定義
- [ ] domain/modelにエンティティ・ファクトリ関数
- [ ] route.tsにルート登録
- [ ] test/helpers.tsにテストDB追加
- [ ] マイグレーション実行
- [ ] テストが通る
- [ ] 型エラーがない

### 既存API修正
- [ ] 影響範囲をgrepで確認
- [ ] 関連テストも更新
- [ ] sharedの型変更がフロントエンドに影響しないか確認
- [ ] テストが通る
- [ ] 型エラーがない
