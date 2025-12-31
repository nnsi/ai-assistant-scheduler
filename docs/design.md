# AI Assistant Scheduler - 設計書

## 1. システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                        Cloudflare                           │
├─────────────────────────┬───────────────────────────────────┤
│   Workers (Frontend)    │       Workers (Backend)           │
│   ┌─────────────────┐   │   ┌─────────────────────────────┐ │
│   │  React + Vite   │   │   │  Hono                       │ │
│   │  SPA            │◄──┼──►│  ├─ REST API                │ │
│   └─────────────────┘   │   │  └─ Mastra Agent            │ │
│                         │   └──────────┬──────────────────┘ │
│                         │              │                    │
│                         │              ▼                    │
│                         │   ┌─────────────────────────────┐ │
│                         │   │  Cloudflare D1 (SQLite)     │ │
│                         │   └─────────────────────────────┘ │
└─────────────────────────┴───────────────────────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │   OpenRouter    │
                          │   (LLM + :online)│
                          └─────────────────┘
```

---

## 2. ディレクトリ構成

```
ai-assistant-scheduler/
├── docs/
│   ├── requirements.md
│   └── design.md
│
├── packages/
│   ├── frontend/                 # React SPA
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Calendar/
│   │   │   │   │   ├── Calendar.tsx
│   │   │   │   │   ├── CalendarDay.tsx
│   │   │   │   │   └── CalendarHeader.tsx
│   │   │   │   ├── Schedule/
│   │   │   │   │   ├── SchedulePopup.tsx
│   │   │   │   │   ├── ScheduleForm.tsx
│   │   │   │   │   └── ScheduleDetail.tsx
│   │   │   │   ├── AI/
│   │   │   │   │   ├── KeywordSuggestions.tsx
│   │   │   │   │   └── SearchResults.tsx
│   │   │   │   └── common/
│   │   │   │       ├── Button.tsx
│   │   │   │       ├── Modal.tsx
│   │   │   │       └── MarkdownRenderer.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSchedules.ts
│   │   │   │   └── useAI.ts
│   │   │   ├── lib/
│   │   │   │   └── api.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── backend/                  # Hono API (Clean Architecture)
│       ├── src/
│       │   ├── domain/                   # ドメイン層（純粋、依存なし）
│       │   │   ├── model/                # エンティティ・値オブジェクト
│       │   │   │   ├── schedule.ts
│       │   │   │   └── supplement.ts
│       │   │   └── infra/                # インフラ層の型定義（interface）
│       │   │       ├── scheduleRepo.ts
│       │   │       ├── supplementRepo.ts
│       │   │       └── aiService.ts
│       │   │
│       │   ├── feature/                  # Feature層（機能単位で完結）
│       │   │   ├── schedule/
│       │   │   │   ├── usecase/          # ユースケース
│       │   │   │   │   ├── createSchedule.ts
│       │   │   │   │   ├── getSchedules.ts
│       │   │   │   │   ├── getScheduleById.ts
│       │   │   │   │   ├── updateSchedule.ts
│       │   │   │   │   └── deleteSchedule.ts
│       │   │   │   ├── handler/          # リクエストハンドラ
│       │   │   │   │   ├── createScheduleHandler.ts
│       │   │   │   │   ├── getSchedulesHandler.ts
│       │   │   │   │   ├── getScheduleByIdHandler.ts
│       │   │   │   │   ├── updateScheduleHandler.ts
│       │   │   │   │   └── deleteScheduleHandler.ts
│       │   │   │   └── route.ts          # DI + ルート定義
│       │   │   │
│       │   │   ├── supplement/
│       │   │   │   ├── usecase/
│       │   │   │   │   ├── saveSupplement.ts
│       │   │   │   │   └── updateMemo.ts
│       │   │   │   ├── handler/
│       │   │   │   │   ├── saveSupplementHandler.ts
│       │   │   │   │   └── updateMemoHandler.ts
│       │   │   │   └── route.ts
│       │   │   │
│       │   │   └── ai/
│       │   │       ├── usecase/
│       │   │       │   ├── suggestKeywords.ts
│       │   │       │   └── searchWithKeywords.ts
│       │   │       ├── handler/
│       │   │       │   ├── suggestKeywordsHandler.ts
│       │   │       │   └── searchHandler.ts
│       │   │       └── route.ts
│       │   │
│       │   ├── infra/                    # インフラ層（外部依存）
│       │   │   ├── drizzle/              # Drizzle ORM実装
│       │   │   │   ├── schema.ts
│       │   │   │   ├── client.ts
│       │   │   │   ├── scheduleRepo.ts
│       │   │   │   └── supplementRepo.ts
│       │   │   └── mastra/               # Mastra AI実装
│       │   │       ├── agents.ts
│       │   │       └── aiService.ts
│       │   │
│       │   ├── shared/                   # 共有ユーティリティ
│       │   │   ├── errors.ts
│       │   │   └── id.ts
│       │   │
│       │   ├── route.ts                  # ルート集約（各featureを束ねる）
│       │   └── index.ts                  # Honoエントリポイント
│       │
│       ├── drizzle.config.ts
│       ├── wrangler.toml
│       ├── tsconfig.json
│       └── package.json
│
├── package.json                  # Monorepo root
├── pnpm-workspace.yaml
└── README.md
```

---

## 3. データベース設計

### 3.1 ERD

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

### 3.2 Drizzle Schema

```typescript
// packages/backend/src/db/schema.ts
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

## 4. API設計

### 4.1 エンドポイント一覧

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

### 4.2 リクエスト/レスポンス例

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

## 5. フロントエンド設計

### 5.1 画面遷移

```
┌────────────────────────────────────────┐
│              カレンダー画面              │
│  ┌────────────────────────────────┐   │
│  │         月表示カレンダー          │   │
│  │  日付クリック → 予定作成モーダル   │   │
│  │  予定クリック → 予定詳細ポップアップ │   │
│  └────────────────────────────────┘   │
└────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────────┐
│  予定作成モーダル  │  │  予定詳細ポップアップ  │
│  ・タイトル入力   │  │  ・タイトル/日時表示   │
│  ・日時選択      │  │  ・AI補足情報表示     │
│  ・保存         │  │  ・メモ入力/表示      │
│       │         │  │  ・編集/削除ボタン    │
│       ▼         │  └─────────────────────┘
│  キーワード選択   │
│  ・AI提案表示    │
│  ・選択/スキップ  │
│       │         │
│       ▼         │
│  検索結果表示    │
│  ・結果確認     │
│  ・保存        │
└─────────────────┘
```

### 5.2 コンポーネント構成

```
App
├── CalendarHeader        # 月切り替え
├── Calendar              # 月カレンダー本体
│   └── CalendarDay       # 日付セル
│       └── ScheduleChip  # 予定チップ（簡易表示）
├── SchedulePopup         # 予定詳細ポップアップ
│   ├── ScheduleDetail    # タイトル/日時
│   ├── SearchResults     # AI検索結果（Markdown表示）
│   └── MemoEditor        # メモ入力エリア
├── ScheduleFormModal     # 予定作成モーダル
│   ├── ScheduleForm      # タイトル/日時入力
│   ├── KeywordSuggestions # AI提案キーワード選択
│   └── SearchResults     # 検索結果プレビュー
└── MarkdownRenderer      # Markdown → HTML変換
```

### 5.3 状態管理

シンプルに`useState` + `useReducer`で管理（ライブラリ不使用）

```typescript
// 主な状態
interface AppState {
  currentMonth: Date;
  schedules: Schedule[];
  selectedSchedule: Schedule | null;
  isFormModalOpen: boolean;
  isLoading: boolean;
}
```

---

## 6. バックエンド設計（Clean Architecture）

### 6.1 レイヤー構成

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

### 6.2 各レイヤーの責務

| レイヤー | 責務 | 例 |
|---------|------|-----|
| **Domain** | ビジネスロジック、エンティティ定義、インターフェース定義 | Schedule Entity, IScheduleRepository |
| **Application** | ユースケース実装、DTO変換 | CreateScheduleUseCase |
| **Infrastructure** | 外部システム接続、フレームワーク依存 | D1Repository, HonoRoutes, MastraAgent |

### 6.3 レイヤー構成

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

### 6.4 依存性注入パターン（関数型）

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

// domain/infra/scheduleRepo.ts
// 型定義のみ（interfaceとして機能）
export type ScheduleRepo = {
  findAll: () => Promise<Schedule[]>;
  findById: (id: string) => Promise<Schedule | null>;
  save: (schedule: Schedule) => Promise<void>;
  update: (schedule: Schedule) => Promise<void>;
  delete: (id: string) => Promise<void>;
};

// usecase/schedule/createSchedule.ts
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

### 6.5 Feature内のHandler

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

### 6.6 Feature内のRoute（DI込み）

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

### 6.7 ルート集約

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

### 6.8 Mastra Agent構成

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

### 6.9 AIサービスの抽象化（関数型）

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

### 6.10 バリデーション（Zod）

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

### 6.11 エラーハンドリング

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

### 6.12 Handler でのバリデーション + エラー処理

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

// APIエラーレスポンス形式
// {
//   "code": "VALIDATION_ERROR",
//   "message": "入力値が不正です",
//   "details": [
//     { "path": "title", "message": "タイトルは必須です" }
//   ]
// }
```

### 6.13 フロントエンドでのバリデーション

```typescript
// frontend/src/lib/validation.ts
import { z } from "zod";
import { createScheduleInputSchema } from "./schemas";

// フォーム送信前にバリデーション
export const validateScheduleForm = (data: unknown) => {
  return createScheduleInputSchema.safeParse(data);
};

// frontend/src/components/Schedule/ScheduleForm.tsx
import { useState } from "react";
import { validateScheduleForm } from "../../lib/validation";

export const ScheduleForm = ({ onSubmit }: Props) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);

    // クライアント側バリデーション
    const result = validateScheduleForm(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    await onSubmit(result.data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" />
      {errors.title && <span className="error">{errors.title}</span>}
      {/* ... */}
    </form>
  );
};

// frontend/src/lib/api.ts
// APIレスポンスもバリデーション
import { scheduleSchema, type Schedule } from "./schemas";

export const fetchSchedule = async (id: string): Promise<Schedule> => {
  const res = await fetch(`/api/schedules/${id}`);
  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data);
  }

  // レスポンスをバリデーション（型安全を保証）
  return scheduleSchema.parse(data);
};
```

### 6.14 スキーマ共有（フロント/バック）

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

ディレクトリ構成にsharedパッケージを追加：

```
packages/
├── frontend/
├── backend/
└── shared/              # 共有スキーマ・型定義
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

### 6.15 単体テストのしやすさ

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

---

## 7. データフロー

### 7.1 予定作成 + AI補足情報フロー

```
[ユーザー]
    │
    │ 1. タイトル・日時入力
    ▼
[Frontend]
    │
    │ 2. POST /api/ai/suggest-keywords
    ▼
[Backend: keywordAgent]
    │
    │ 3. OpenRouter (Gemini) → キーワード提案
    ▼
[Frontend]
    │
    │ 4. ユーザーがキーワード選択
    │
    │ 5. POST /api/schedules (予定保存)
    │    POST /api/ai/search (検索実行)
    ▼
[Backend: searchAgent]
    │
    │ 6. OpenRouter (Gemini:online) → Web検索
    ▼
[Backend]
    │
    │ 7. D1に保存 (schedule + supplement)
    ▼
[Frontend]
    │
    │ 8. 結果表示
    ▼
[ユーザー]
```

---

## 8. 技術詳細

### 8.1 Markdownパーサー

軽量パーサー候補：
- **marked** - 軽量、高速、十分な機能
- **micromark** - さらに軽量

```typescript
// packages/frontend/src/components/common/MarkdownRenderer.tsx
import { marked } from "marked";

export function MarkdownRenderer({ content }: { content: string }) {
  const html = marked.parse(content);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

### 8.2 日付ライブラリ

**date-fns** を使用（軽量、tree-shaking対応）

```typescript
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ja } from "date-fns/locale";
```

### 8.3 ID生成

**nanoid** を使用

```typescript
import { nanoid } from "nanoid";
const id = nanoid(); // "V1StGXR8_Z5jdHi6B-myT"
```

---

## 9. 開発環境

### 9.1 パッケージマネージャ

**pnpm** + workspaces

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
```

### 9.2 開発コマンド

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

## 10. UI/CSS構成

### 10.1 技術選定

| 技術 | 用途 |
|------|------|
| **Tailwind CSS** | ユーティリティファーストCSS |
| **shadcn/ui** | UIコンポーネント（必要に応じて） |
| **Lucide React** | アイコン |

### 10.2 Tailwind設定

```typescript
// packages/frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        schedule: {
          default: "#3b82f6",
          ai: "#8b5cf6",  // AI補足情報あり
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### 10.3 コンポーネントスタイル例

```tsx
// frontend/src/components/Calendar/CalendarDay.tsx
type Props = {
  date: Date;
  schedules: Schedule[];
  isToday: boolean;
  isCurrentMonth: boolean;
  onClick: () => void;
};

export const CalendarDay = ({
  date,
  schedules,
  isToday,
  isCurrentMonth,
  onClick,
}: Props) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "min-h-24 p-2 border-b border-r cursor-pointer hover:bg-gray-50",
        !isCurrentMonth && "bg-gray-100 text-gray-400",
        isToday && "bg-blue-50"
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center w-7 h-7 text-sm",
          isToday && "bg-blue-500 text-white rounded-full"
        )}
      >
        {date.getDate()}
      </span>

      <div className="mt-1 space-y-1">
        {schedules.slice(0, 3).map((s) => (
          <div
            key={s.id}
            className={cn(
              "text-xs px-2 py-1 rounded truncate",
              s.hasSupplement
                ? "bg-purple-100 text-purple-700"
                : "bg-blue-100 text-blue-700"
            )}
          >
            {s.title}
          </div>
        ))}
        {schedules.length > 3 && (
          <div className="text-xs text-gray-500">
            +{schedules.length - 3}件
          </div>
        )}
      </div>
    </div>
  );
};

// shared/lib/cn.ts (className結合ユーティリティ)
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

---

## 11. 環境変数

### 11.1 バックエンド（Cloudflare Workers）

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

### 11.2 環境変数一覧

| 変数名 | 説明 | 設定方法 |
|--------|------|----------|
| `DB` | D1データベースバインディング | wrangler.toml |
| `OPENROUTER_API_KEY` | OpenRouter APIキー | `wrangler secret put` |
| `FRONTEND_URL` | フロントエンドURL（CORS用） | wrangler.toml |

### 11.3 フロントエンド

```bash
# packages/frontend/.env
VITE_API_URL=http://localhost:8787/api

# packages/frontend/.env.production
VITE_API_URL=https://ai-scheduler-api.<account>.workers.dev/api
```

### 11.4 ローカル開発

```bash
# packages/backend/.dev.vars（gitignore対象）
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

### 11.5 型安全な環境変数

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

## 12. テスト戦略

### 12.1 テストレイヤー

| レイヤー | ツール | 対象 |
|---------|--------|------|
| 単体テスト | Vitest | UseCase, Handler, 純粋関数 |
| 統合テスト | Vitest + Miniflare | API全体（D1含む） |
| E2Eテスト | Playwright | 主要ユーザーフロー（MVP後） |

### 12.2 テストファイル配置

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

### 12.3 統合テスト例

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

### 12.4 カバレッジ目標

| 対象 | 目標 |
|------|------|
| UseCase | 90%以上 |
| Handler | 80%以上 |
| 全体 | 70%以上 |

```json
// vitest.config.ts
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

## 13. 今後の拡張ポイント

| 機能 | 拡張方法 |
|------|----------|
| 週表示・日表示 | Calendarコンポーネントにview prop追加 |
| 繰り返し予定 | schedulesテーブルにrecurrence_rule追加 |
| 認証 | Cloudflare Access or 自前JWT |
| リッチテキスト編集 | Tiptapを後から導入 |
| 自由キーワード入力 | KeywordSuggestionsに入力フィールド追加 |
