# インフラ・環境・テスト設計

## 1. 開発環境

### 1.1 パッケージマネージャ

**pnpm** + workspaces

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
```

### 1.2 ディレクトリ構成

```
packages/
├── frontend/           # React SPA
├── backend/            # Hono API
└── shared/             # 共有スキーマ・型定義
    ├── src/
    │   ├── schemas/
    │   │   ├── schedule.ts
    │   │   ├── supplement.ts
    │   │   ├── ai.ts
    │   │   └── errors.ts
    │   └── index.ts
    ├── tsconfig.json
    └── package.json
```

### 1.3 開発コマンド

```bash
# 依存インストール
pnpm install

# 開発サーバー起動
pnpm dev           # frontend + backend 同時起動

# ビルド
pnpm build

# D1マイグレーション
pnpm db:migrate

# デプロイ
pnpm deploy
```

---

## 2. 環境変数

### 2.1 バックエンド（Cloudflare Workers）

```toml
# packages/backend/wrangler.toml
name = "ai-scheduler-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "ai-scheduler-db"
database_id = "<your-database-id>"

[vars]
FRONTEND_URL = "https://ai-scheduler.pages.dev"

# 機密情報はシークレットで管理
# wrangler secret put OPENROUTER_API_KEY
```

### 2.2 環境変数一覧

| 変数名 | 説明 | 設定方法 |
|--------|------|----------|
| `DB` | D1データベースバインディング | wrangler.toml |
| `OPENROUTER_API_KEY` | OpenRouter APIキー | `wrangler secret put` |
| `FRONTEND_URL` | フロントエンドURL（CORS用） | wrangler.toml |

### 2.3 フロントエンド

```bash
# packages/frontend/.env
VITE_API_URL=http://localhost:8787/api

# packages/frontend/.env.production
VITE_API_URL=https://ai-scheduler-api.<account>.workers.dev/api
```

### 2.4 ローカル開発

```bash
# packages/backend/.dev.vars（gitignore対象）
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

### 2.5 型安全な環境変数

```typescript
// packages/backend/src/env.ts
import { z } from "zod";

const envSchema = z.object({
  DB: z.custom<D1Database>(),
  OPENROUTER_API_KEY: z.string().min(1),
  FRONTEND_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

// packages/frontend/src/env.ts
const envSchema = z.object({
  VITE_API_URL: z.string().url(),
});

export const env = envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
});
```

---

## 3. デプロイ

### 3.1 Cloudflare構成

| サービス | 用途 |
|----------|------|
| Cloudflare Workers (Frontend) | React SPA配信 |
| Cloudflare Workers (Backend) | Hono API |
| Cloudflare D1 | SQLiteデータベース |

### 3.2 デプロイコマンド

```bash
# バックエンドデプロイ
cd packages/backend
pnpm wrangler deploy

# フロントエンドデプロイ
cd packages/frontend
pnpm wrangler deploy
```

### 3.3 D1データベース操作

```bash
# D1データベース作成
wrangler d1 create ai-scheduler-db

# マイグレーション実行（ローカル）
wrangler d1 execute ai-scheduler-db --local --file=./migrations/0001_init.sql

# マイグレーション実行（本番）
wrangler d1 execute ai-scheduler-db --file=./migrations/0001_init.sql
```

---

## 4. テスト戦略

### 4.1 テストレイヤー

| レイヤー | ツール | 対象 |
|---------|--------|------|
| 単体テスト | Vitest | UseCase, Handler, 純粋関数 |
| 統合テスト | Vitest + Miniflare | API全体（D1含む） |
| E2Eテスト | Playwright | 主要ユーザーフロー（MVP後） |

### 4.2 テストファイル配置

コロケーション方式（テストは実装ファイルの隣に配置）

```
feature/
├── schedule/
│   ├── usecase/
│   │   ├── createSchedule.ts
│   │   └── createSchedule.test.ts    # コロケーション
│   ├── handler/
│   │   ├── createScheduleHandler.ts
│   │   └── createScheduleHandler.test.ts
│   └── route.ts
```

### 4.3 単体テスト例

```typescript
// feature/schedule/usecase/createSchedule.test.ts
import { describe, it, expect, vi } from "vitest";
import { createCreateScheduleUseCase } from "./createSchedule";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";

describe("createScheduleUseCase", () => {
  it("should create and save a schedule", async () => {
    // モックリポジトリ（型定義に沿ったオブジェクトを作るだけ）
    const mockRepo: ScheduleRepo = {
      findAll: vi.fn(),
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const createSchedule = createCreateScheduleUseCase(mockRepo);

    const result = await createSchedule({
      title: "テスト予定",
      startAt: "2025-01-10T12:00:00+09:00",
    });

    expect(result.title).toBe("テスト予定");
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ title: "テスト予定" })
    );
  });
});
```

### 4.4 統合テスト例

```typescript
// packages/backend/src/integration.test.ts
import { unstable_dev } from "wrangler";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

describe("Schedule API Integration", () => {
  let worker: UnstableDevWorker;

  beforeAll(async () => {
    worker = await unstable_dev("src/index.ts", {
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it("POST /api/schedules creates a schedule", async () => {
    const res = await worker.fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "テスト予定",
        startAt: "2025-01-10T12:00:00+09:00",
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.title).toBe("テスト予定");
  });

  it("GET /api/schedules returns schedules", async () => {
    const res = await worker.fetch("/api/schedules");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

### 4.5 カバレッジ目標

| 対象 | 目標 |
|------|------|
| UseCase | 90%以上 |
| Handler | 80%以上 |
| 全体 | 70%以上 |

### 4.6 Vitest設定

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["**/*.test.ts", "**/index.ts"],
    },
  },
});
```

---

## 5. ID生成

**nanoid** を使用

```typescript
// packages/backend/src/shared/id.ts
import { nanoid } from "nanoid";

export const generateId = () => nanoid(); // "V1StGXR8_Z5jdHi6B-myT"
```

---

## 6. 技術詳細

### 6.1 Markdownパーサー

軽量パーサー候補：
- **marked** - 軽量、高速、十分な機能
- **micromark** - さらに軽量

### 6.2 日付ライブラリ

**date-fns** を使用（軽量、tree-shaking対応）

```typescript
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ja } from "date-fns/locale";
```

---

## 7. 今後の拡張ポイント

| 機能 | 拡張方法 |
|------|----------|
| 週表示・日表示 | Calendarコンポーネントにview prop追加 |
| 繰り返し予定 | schedulesテーブルにrecurrence_rule追加 |
| 認証 | Cloudflare Access or 自前JWT |
| リッチテキスト編集 | Tiptapを後から導入 |
| 自由キーワード入力 | KeywordSuggestionsに入力フィールド追加 |
