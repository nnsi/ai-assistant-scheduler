# バックエンド設計

## 1. ディレクトリ構成

```
packages/backend/                  # Hono API (Clean Architecture)
├── src/
│   ├── domain/                   # ドメイン層（純粋、依存なし）
│   │   ├── model/                # エンティティ・値オブジェクト
│   │   │   ├── schedule.ts
│   │   │   └── supplement.ts
│   │   └── infra/                # インフラ層の型定義（interface）
│   │       ├── scheduleRepo.ts
│   │       ├── supplementRepo.ts
│   │       └── aiService.ts
│   │
│   ├── feature/                  # Feature層（機能単位で完結）
│   │   ├── schedule/
│   │   │   ├── usecase/          # ユースケース
│   │   │   │   ├── createSchedule.ts
│   │   │   │   ├── getSchedules.ts
│   │   │   │   ├── getScheduleById.ts
│   │   │   │   ├── updateSchedule.ts
│   │   │   │   └── deleteSchedule.ts
│   │   │   ├── handler/          # リクエストハンドラ
│   │   │   │   ├── createScheduleHandler.ts
│   │   │   │   ├── getSchedulesHandler.ts
│   │   │   │   ├── getScheduleByIdHandler.ts
│   │   │   │   ├── updateScheduleHandler.ts
│   │   │   │   └── deleteScheduleHandler.ts
│   │   │   └── route.ts          # DI + ルート定義
│   │   │
│   │   ├── supplement/
│   │   │   ├── usecase/
│   │   │   │   ├── saveSupplement.ts
│   │   │   │   └── updateMemo.ts
│   │   │   ├── handler/
│   │   │   │   ├── saveSupplementHandler.ts
│   │   │   │   └── updateMemoHandler.ts
│   │   │   └── route.ts
│   │   │
│   │   └── ai/
│   │       ├── usecase/
│   │       │   ├── suggestKeywords.ts
│   │       │   └── searchWithKeywords.ts
│   │       ├── handler/
│   │       │   ├── suggestKeywordsHandler.ts
│   │       │   └── searchHandler.ts
│   │       └── route.ts
│   │
│   ├── infra/                    # インフラ層（外部依存）
│   │   ├── drizzle/              # Drizzle ORM実装
│   │   │   ├── schema.ts
│   │   │   ├── client.ts
│   │   │   ├── scheduleRepo.ts
│   │   │   └── supplementRepo.ts
│   │   └── mastra/               # Mastra AI実装
│   │       ├── agents.ts
│   │       └── aiService.ts
│   │
│   ├── shared/                   # 共有ユーティリティ
│   │   ├── errors.ts
│   │   └── id.ts
│   │
│   ├── route.ts                  # ルート集約（各featureを束ねる）
│   └── index.ts                  # Honoエントリポイント
│
├── drizzle.config.ts
├── wrangler.toml
├── tsconfig.json
└── package.json
```

---

## 2. データベース設計

### 2.1 ERD

```
┌─────────────────────┐       ┌─────────────────────────┐
│     schedules       │       │  schedule_supplements   │
├─────────────────────┤       ├─────────────────────────┤
│ id (PK)             │──────<│ id (PK)                 │
│ title               │       │ schedule_id (FK)        │
│ start_at            │       │ keywords (JSON)         │
│ end_at              │       │ ai_result (TEXT)        │
│ created_at          │       │ user_memo (TEXT)        │
│ updated_at          │       │ created_at              │
└─────────────────────┘       │ updated_at              │
                              └─────────────────────────┘
```

### 2.2 Drizzle Schema

```typescript
// packages/backend/src/infra/drizzle/schema.ts
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const schedules = sqliteTable("schedules", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  startAt: text("start_at").notNull(),      // ISO8601
  endAt: text("end_at"),                     // ISO8601, nullable
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const scheduleSupplements = sqliteTable("schedule_supplements", {
  id: text("id").primaryKey(),
  scheduleId: text("schedule_id").notNull().references(() => schedules.id),
  keywords: text("keywords"),                 // JSON array
  aiResult: text("ai_result"),                // Markdown
  userMemo: text("user_memo"),                // Markdown
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
```

---

## 3. API設計

### 3.1 エンドポイント一覧

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/schedules` | スケジュール一覧取得 |
| GET | `/api/schedules/:id` | スケジュール詳細取得 |
| POST | `/api/schedules` | スケジュール作成 |
| PUT | `/api/schedules/:id` | スケジュール更新 |
| DELETE | `/api/schedules/:id` | スケジュール削除 |
| POST | `/api/ai/suggest-keywords` | キーワード提案 |
| POST | `/api/ai/search` | Web検索実行 |
| PUT | `/api/schedules/:id/supplement` | 補足情報更新（メモ等） |

### 3.2 リクエスト/レスポンス例

#### POST /api/schedules
```json
// Request
{
  "title": "都内 レストラン 新宿",
  "startAt": "2025-01-10T12:00:00+09:00"
}

// Response
{
  "id": "uuid-xxx",
  "title": "都内 レストラン 新宿",
  "startAt": "2025-01-10T12:00:00+09:00",
  "endAt": null,
  "createdAt": "2025-01-01T10:00:00+09:00",
  "updatedAt": "2025-01-01T10:00:00+09:00"
}
```

#### POST /api/ai/suggest-keywords
```json
// Request
{
  "title": "都内 レストラン 新宿",
  "startAt": "2025-01-10T12:00:00+09:00"
}

// Response
{
  "keywords": [
    "5000円前後",
    "3000円前後",
    "デート向け",
    "家族利用",
    "イタリアン",
    "和食",
    "個室あり"
  ]
}
```

#### POST /api/ai/search
```json
// Request
{
  "scheduleId": "uuid-xxx",
  "title": "都内 レストラン 新宿",
  "startAt": "2025-01-10T12:00:00+09:00",
  "keywords": ["家族利用", "3000円前後", "イタリアン"]
}

// Response
{
  "result": "## おすすめレストラン\n\n### 1. トラットリア○○\n- 評価: ⭐4.2\n- 住所: 新宿区...\n- 予算: 2,500円〜\n\n### 2. リストランテ△△\n..."
}
```

---

## 4. Clean Architecture

### 4.1 レイヤー構成

```
┌─────────────────────────────────────────────────────────┐
│                    Infrastructure                        │
│  (Routes, D1Repository, MastraService)                  │
├─────────────────────────────────────────────────────────┤
│                     Application                          │
│  (UseCases, DTOs)                                       │
├─────────────────────────────────────────────────────────┤
│                       Domain                             │
│  (Entities, Repository Interfaces, Service Interfaces)  │
└─────────────────────────────────────────────────────────┘

依存の方向: Infrastructure → Application → Domain
```

### 4.2 各レイヤーの責務

| レイヤー | 責務 | 例 |
|---------|------|-----|
| **Domain** | ビジネスロジック、エンティティ定義、インターフェース定義 | Schedule Entity, ScheduleRepo type |
| **Application** | ユースケース実装、DTO変換 | createScheduleUseCase |
| **Infrastructure** | 外部システム接続、フレームワーク依存 | drizzle/scheduleRepo, MastraAgent |

### 4.3 レイヤー配置

```
src/
├── domain/           # 純粋なドメイン（外部依存なし）
│   ├── model/        # エンティティ、値オブジェクト
│   └── infra/        # インフラ層の型定義（interface）
│
├── feature/          # 機能単位で完結
│   ├── schedule/
│   │   ├── usecase/  # ビジネスロジック
│   │   ├── handler/  # リクエストハンドラ
│   │   └── route.ts  # DI + ルート定義
│   ├── supplement/
│   └── ai/
│
├── infra/            # 外部システム実装
│   ├── drizzle/
│   └── mastra/
│
├── route.ts          # 各featureのルートを集約
└── index.ts          # エントリポイント
```

---

## 5. 依存性注入パターン（関数型）

### 5.1 Domain Model

```typescript
// domain/model/schedule.ts
// Entity は純粋なデータ型 + ファクトリ関数
export type Schedule = {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateScheduleInput = {
  title: string;
  startAt: string;
  endAt?: string;
};

export const createSchedule = (input: CreateScheduleInput): Schedule => ({
  id: generateId(),
  title: input.title,
  startAt: input.startAt,
  endAt: input.endAt ?? null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
```

### 5.2 Repository Interface

```typescript
// domain/infra/scheduleRepo.ts
// 型定義のみ（interfaceとして機能）
export type ScheduleRepo = {
  findAll: () => Promise<Schedule[]>;
  findById: (id: string) => Promise<Schedule | null>;
  save: (schedule: Schedule) => Promise<void>;
  update: (schedule: Schedule) => Promise<void>;
  delete: (id: string) => Promise<void>;
};
```

### 5.3 UseCase

```typescript
// feature/schedule/usecase/createSchedule.ts
// UseCase はファクトリ関数（クロージャで依存を保持）
export const createCreateScheduleUseCase = (repo: ScheduleRepo) => {
  return async (input: CreateScheduleInput): Promise<Schedule> => {
    const schedule = createSchedule(input);
    await repo.save(schedule);
    return schedule;
  };
};

// 型エイリアスで使いやすく
export type CreateScheduleUseCase = ReturnType<typeof createCreateScheduleUseCase>;
```

### 5.4 Repository Implementation

```typescript
// infra/drizzle/scheduleRepo.ts
// Drizzle実装
import { eq } from "drizzle-orm";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { schedules } from "./schema";
import type { ScheduleRepo } from "../../domain/infra/scheduleRepo";
import type { Schedule } from "../../domain/model/schedule";

export const createScheduleRepo = (db: DrizzleD1Database): ScheduleRepo => ({
  findAll: async () => {
    const rows = await db.select().from(schedules);
    return rows.map(toSchedule);
  },

  findById: async (id) => {
    const rows = await db.select().from(schedules).where(eq(schedules.id, id));
    return rows[0] ? toSchedule(rows[0]) : null;
  },

  save: async (schedule) => {
    await db.insert(schedules).values(toRow(schedule));
  },

  update: async (schedule) => {
    await db
      .update(schedules)
      .set(toRow(schedule))
      .where(eq(schedules.id, schedule.id));
  },

  delete: async (id) => {
    await db.delete(schedules).where(eq(schedules.id, id));
  },
});

// Row ↔ Entity 変換は純粋関数
const toSchedule = (row: typeof schedules.$inferSelect): Schedule => ({
  id: row.id,
  title: row.title,
  startAt: row.startAt,
  endAt: row.endAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const toRow = (schedule: Schedule): typeof schedules.$inferInsert => ({
  id: schedule.id,
  title: schedule.title,
  startAt: schedule.startAt,
  endAt: schedule.endAt,
  createdAt: schedule.createdAt,
  updatedAt: schedule.updatedAt,
});
```

---

## 6. Handler

```typescript
// feature/schedule/handler/createScheduleHandler.ts
import type { Context } from "hono";
import type { CreateScheduleUseCase } from "../usecase/createSchedule";

// Handler はUseCaseを受け取る関数を返す
export const createCreateScheduleHandler = (
  createSchedule: CreateScheduleUseCase
) => {
  return async (c: Context) => {
    const input = await c.req.json();
    const schedule = await createSchedule(input);
    return c.json(schedule, 201);
  };
};

// feature/schedule/handler/getSchedulesHandler.ts
import type { GetSchedulesUseCase } from "../usecase/getSchedules";

export const createGetSchedulesHandler = (
  getSchedules: GetSchedulesUseCase
) => {
  return async (c: Context) => {
    const schedules = await getSchedules();
    return c.json(schedules);
  };
};

// feature/schedule/handler/getScheduleByIdHandler.ts
import type { GetScheduleByIdUseCase } from "../usecase/getScheduleById";

export const createGetScheduleByIdHandler = (
  getScheduleById: GetScheduleByIdUseCase
) => {
  return async (c: Context) => {
    const schedule = await getScheduleById(c.req.param("id"));
    if (!schedule) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.json(schedule);
  };
};
```

---

## 7. Feature Route（DI込み）

```typescript
// feature/schedule/route.ts
import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { createScheduleRepo } from "../../infra/drizzle/scheduleRepo";
import { createCreateScheduleUseCase } from "./usecase/createSchedule";
import { createGetSchedulesUseCase } from "./usecase/getSchedules";
import { createGetScheduleByIdUseCase } from "./usecase/getScheduleById";
import { createCreateScheduleHandler } from "./handler/createScheduleHandler";
import { createGetSchedulesHandler } from "./handler/getSchedulesHandler";
import { createGetScheduleByIdHandler } from "./handler/getScheduleByIdHandler";

type Bindings = { DB: D1Database };

export const scheduleRoute = new Hono<{ Bindings: Bindings }>();

// ミドルウェアでDIを解決
scheduleRoute.use("*", async (c, next) => {
  const db = drizzle(c.env.DB);
  const repo = createScheduleRepo(db);

  // UseCaseを生成してcontextに保存
  c.set("createSchedule", createCreateScheduleUseCase(repo));
  c.set("getSchedules", createGetSchedulesUseCase(repo));
  c.set("getScheduleById", createGetScheduleByIdUseCase(repo));

  await next();
});

// ルート定義（Handlerを使用）
scheduleRoute.get("/", (c) => {
  const handler = createGetSchedulesHandler(c.get("getSchedules"));
  return handler(c);
});

scheduleRoute.post("/", (c) => {
  const handler = createCreateScheduleHandler(c.get("createSchedule"));
  return handler(c);
});

scheduleRoute.get("/:id", (c) => {
  const handler = createGetScheduleByIdHandler(c.get("getScheduleById"));
  return handler(c);
});
```

---

## 8. ルート集約

```typescript
// src/route.ts
import { Hono } from "hono";
import { scheduleRoute } from "./feature/schedule/route";
import { supplementRoute } from "./feature/supplement/route";
import { aiRoute } from "./feature/ai/route";

type Bindings = {
  DB: D1Database;
  OPENROUTER_API_KEY: string;
};

export const apiRoutes = new Hono<{ Bindings: Bindings }>();

apiRoutes.route("/schedules", scheduleRoute);
apiRoutes.route("/supplements", supplementRoute);
apiRoutes.route("/ai", aiRoute);

// src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { apiRoutes } from "./route";

const app = new Hono();

app.use("*", cors());
app.route("/api", apiRoutes);

export default app;
```

---

## 9. Mastra Agent構成

```typescript
// infra/mastra/agents.ts
import { Agent } from "@mastra/core/agent";

export const createKeywordAgent = (apiKey: string) =>
  new Agent({
    id: "keyword-agent",
    name: "Keyword Suggestion Agent",
    instructions: `
      あなたはスケジュールのタイトルから、ユーザーが調べたそうなことを提案するアシスタントです。
      タイトルと日時から、関連するキーワードを5〜8個提案してください。
      キーワードは具体的で、検索に使えるものにしてください。
      JSON配列形式で返してください。例: ["キーワード1", "キーワード2"]
    `,
    model: {
      provider: "openrouter",
      name: "google/gemini-2.5-flash",
      apiKey,
    },
  });

export const createSearchAgent = (apiKey: string) =>
  new Agent({
    id: "search-agent",
    name: "Web Search Agent",
    instructions: `
      あなたはユーザーの予定に関連する情報を検索し、わかりやすくまとめるアシスタントです。
      検索結果をMarkdown形式で整理して返してください。
    `,
    model: {
      provider: "openrouter",
      name: "google/gemini-2.5-flash:online", // Web検索有効
      apiKey,
    },
  });
```

---

## 10. AIサービスの抽象化（関数型）

```typescript
// domain/infra/aiService.ts
// 型定義のみ
export type AiService = {
  suggestKeywords: (title: string, startAt: string) => Promise<string[]>;
  searchWithKeywords: (title: string, startAt: string, keywords: string[]) => Promise<string>;
};

// infra/mastra/aiService.ts
// ファクトリ関数でAgentを注入
import type { Agent } from "@mastra/core/agent";
import type { AiService } from "../../domain/infra/aiService";

export const createAiService = (
  keywordAgent: Agent,
  searchAgent: Agent
): AiService => ({
  suggestKeywords: async (title, startAt) => {
    const result = await keywordAgent.generate(`
      タイトル: ${title}
      日時: ${startAt}
    `);
    return JSON.parse(result.text);
  },

  searchWithKeywords: async (title, startAt, keywords) => {
    const result = await searchAgent.generate(`
      タイトル: ${title}
      日時: ${startAt}
      調べたいこと: ${keywords.join(", ")}
    `);
    return result.text;
  },
});
```

---

## 11. バリデーション（Zod）

### 11.1 入力スキーマ

```typescript
// domain/model/schedule.ts
import { z } from "zod";

// 入力スキーマ
export const createScheduleInputSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(100),
  startAt: z.string().datetime({ message: "有効な日時形式で入力してください" }),
  endAt: z.string().datetime().optional(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleInputSchema>;

// 出力スキーマ（API レスポンス）
export const scheduleSchema = z.object({
  id: z.string(),
  title: z.string(),
  startAt: z.string(),
  endAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Schedule = z.infer<typeof scheduleSchema>;
```

### 11.2 補足情報・AIスキーマ

```typescript
// domain/model/supplement.ts
export const saveSupplementInputSchema = z.object({
  scheduleId: z.string().min(1),
  keywords: z.array(z.string()).min(1, "キーワードを1つ以上選択してください"),
});

export const updateMemoInputSchema = z.object({
  scheduleId: z.string().min(1),
  userMemo: z.string().max(10000),
});

// domain/model/ai.ts
export const suggestKeywordsInputSchema = z.object({
  title: z.string().min(1),
  startAt: z.string().datetime(),
});

export const searchInputSchema = z.object({
  scheduleId: z.string().min(1),
  title: z.string().min(1),
  startAt: z.string().datetime(),
  keywords: z.array(z.string()).min(1),
});
```

---

## 12. エラーハンドリング

### 12.1 AppError型

```typescript
// shared/errors.ts
import { z } from "zod";

// アプリケーションエラー型
export type AppError = {
  code: ErrorCode;
  message: string;
  details?: unknown;
};

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "AI_ERROR"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

// エラーファクトリ
export const createValidationError = (error: z.ZodError): AppError => ({
  code: "VALIDATION_ERROR",
  message: "入力値が不正です",
  details: error.errors.map((e) => ({
    path: e.path.join("."),
    message: e.message,
  })),
});

export const createNotFoundError = (resource: string): AppError => ({
  code: "NOT_FOUND",
  message: `${resource}が見つかりません`,
});

export const createAiError = (message: string): AppError => ({
  code: "AI_ERROR",
  message: `AI処理エラー: ${message}`,
});
```

### 12.2 Result型

```typescript
// shared/result.ts
// Result型でエラーハンドリング（例外を投げない）
export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// UseCase での使用例
// feature/schedule/usecase/getScheduleById.ts
export const createGetScheduleByIdUseCase = (repo: ScheduleRepo) => {
  return async (id: string): Promise<Result<Schedule>> => {
    const schedule = await repo.findById(id);
    if (!schedule) {
      return err(createNotFoundError("スケジュール"));
    }
    return ok(schedule);
  };
};
```

### 12.3 Handler でのバリデーション + エラー処理

```typescript
// feature/schedule/handler/createScheduleHandler.ts
import { createScheduleInputSchema } from "../../../domain/model/schedule";
import { createValidationError } from "../../../shared/errors";

export const createCreateScheduleHandler = (
  createSchedule: CreateScheduleUseCase
) => {
  return async (c: Context) => {
    // 1. リクエストボディ取得
    const body = await c.req.json();

    // 2. バリデーション
    const parsed = createScheduleInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(createValidationError(parsed.error), 400);
    }

    // 3. UseCase実行
    const result = await createSchedule(parsed.data);

    // 4. Result型でエラーハンドリング
    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json(result.value, 201);
  };
};

// shared/http.ts
export const getStatusCode = (code: ErrorCode): number => {
  switch (code) {
    case "VALIDATION_ERROR": return 400;
    case "NOT_FOUND": return 404;
    case "AI_ERROR": return 502;
    case "DATABASE_ERROR": return 500;
    case "INTERNAL_ERROR": return 500;
  }
};
```

### 12.4 APIエラーレスポンス形式

```json
{
  "code": "VALIDATION_ERROR",
  "message": "入力値が不正です",
  "details": [
    { "path": "title", "message": "タイトルは必須です" }
  ]
}
```

---

## 13. スキーマ共有（フロント/バック）

```typescript
// packages/shared/src/schemas/schedule.ts
// フロントエンドとバックエンドで共有
import { z } from "zod";

export const createScheduleInputSchema = z.object({
  title: z.string().min(1).max(100),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
});

export const scheduleSchema = z.object({
  id: z.string(),
  title: z.string(),
  startAt: z.string(),
  endAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// packages/shared/src/schemas/index.ts
export * from "./schedule";
export * from "./supplement";
export * from "./ai";
export * from "./errors";
```

---

## 14. 単体テストのしやすさ

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

// feature/schedule/handler/createScheduleHandler.test.ts
import { createCreateScheduleHandler } from "./createScheduleHandler";

describe("createScheduleHandler", () => {
  it("should return created schedule with 201", async () => {
    // UseCaseのモック
    const mockUseCase = vi.fn().mockResolvedValue({
      id: "123",
      title: "テスト",
      startAt: "2025-01-10T12:00:00+09:00",
    });

    const handler = createCreateScheduleHandler(mockUseCase);

    // Honoのコンテキストモック
    const mockContext = {
      req: { json: vi.fn().mockResolvedValue({ title: "テスト" }) },
      json: vi.fn(),
    };

    await handler(mockContext as any);

    expect(mockContext.json).toHaveBeenCalledWith(
      expect.objectContaining({ title: "テスト" }),
      201
    );
  });
});

// feature/ai/usecase/suggestKeywords.test.ts
import { createSuggestKeywordsUseCase } from "./suggestKeywords";
import type { AiService } from "../../../domain/infra/aiService";

describe("suggestKeywordsUseCase", () => {
  it("should return keywords from AI", async () => {
    const mockAiService: AiService = {
      suggestKeywords: vi.fn().mockResolvedValue([
        "3000円前後",
        "家族利用",
        "イタリアン",
      ]),
      searchWithKeywords: vi.fn(),
    };

    const suggestKeywords = createSuggestKeywordsUseCase(mockAiService);

    const result = await suggestKeywords("都内 レストラン 新宿", "2025-01-10");

    expect(result).toHaveLength(3);
    expect(result).toContain("家族利用");
  });
});
```
