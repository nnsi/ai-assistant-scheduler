# 拡張性評価レポート (2026-01-10)

**評価日**: 2026-01-10
**評価手法**: 2つのExploreサブエージェントによる並列評価
**対象**: packages/frontend, packages/backend

---

## エグゼクティブサマリー

| 対象 | スコア | 強み | 主な課題 |
|------|--------|------|----------|
| Frontend | 6.5/10 | TanStack統合、型安全API、テスト体制 | MainApp肥大化、Atomic Design未採用 |
| Backend | 7.6/10 | DDD原則、リポジトリパターン、テストヘルパー | テストDB同期、AI出力解析の脆弱性 |

---

## 1. フロントエンド評価

### 1.1 アーキテクチャ

**ディレクトリ構造** (6.5/10)

```
src/
├── components/           # 機能ベース分割
│   ├── AI/              # AI関連
│   ├── Auth/            # 認証
│   ├── Calendar/        # カレンダー表示
│   ├── Schedule/        # スケジュール管理
│   └── common/          # Button, Modal のみ
├── contexts/            # AuthContext, CalendarContext
├── hooks/               # useSchedules, useAI等
├── lib/                 # API, ユーティリティ
└── test/
```

**評価**:
- 機能ごとの分割により概念的な凝集度が高い
- `common/`にはButton, Modalのみで再利用可能コンポーネントが少ない
- Atomic Designパターン未採用

### 1.2 状態管理

| 層 | 実装 | 評価 |
|---|---|---|
| グローバル | Context (Auth, Calendar) | 良好 |
| サーバー状態 | TanStack Query | 優秀 |
| ページ | useState (MainApp) | **課題あり** |

**MainApp.tsxの問題** (`src/components/MainApp.tsx`):
- 390行の大きなコンポーネント
- 18個以上のuseStateを管理
- モーダル追加ごとに状態が増加

**未使用のuseModalManager**:
- `src/hooks/useModalManager.ts`にreducerベースの管理hookが存在
- MainAppでは使用されていない

### 1.3 モジュール性

**カスタムフック** (7/10):
- `useSchedules` - CRUD + TanStack Query
- `useAI` - ストリーミング対応、AbortController
- `useCategories`, `useCalendars`, `useProfile`等

**型共有** (優秀):
- `@ai-scheduler/shared`のZodスキーマを再利用
- `safeParse`による実行時検証

### 1.4 テスト容易性 (8/10)

- Unit: `useSchedules.test.tsx`, `useAI.test.ts`
- E2E: Playwright (`auth-flow.spec.ts`, `schedule.spec.ts`等)
- Storybook: Button, Modal, ScheduleDetail

### 1.5 主な課題

| 優先度 | 課題 | 影響 |
|--------|------|------|
| 高 | MainAppへの状態集中 | 新機能追加時の複雑化 |
| 高 | Atomic Design未採用 | コンポーネント再利用性低 |
| 中 | useModalManager未使用 | ボイラープレート増加 |
| 中 | フォーム検証の重複 | 保守性低下 |

### 1.6 改善提案

**Phase 1: useModalManager統合**
```typescript
// 現状: MainAppで個別管理
const [isFormModalOpen, setIsFormModalOpen] = useState(false);
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
// ...10個以上

// 改善: useModalManager使用
const { state, openModal, closeModal } = useModalManager();
```

**Phase 2: Atoms抽出**
```
components/
├── atoms/           # Input, Select, Checkbox, Label
├── molecules/       # FormField, TabGroup
├── organisms/       # ScheduleForm, SearchResults
└── features/        # 現在のディレクトリ構造
```

---

## 2. バックエンド評価

### 2.1 アーキテクチャ (8/10)

**フィーチャーベースのレイヤードアーキテクチャ**:

```
src/
├── domain/
│   ├── model/          # エンティティ、ファクトリ
│   └── infra/          # リポジトリインターフェース
├── feature/            # 自己完結した機能単位
│   ├── ai/
│   ├── auth/
│   ├── calendar/
│   ├── schedule/
│   └── ...
├── infra/
│   ├── drizzle/        # DB実装
│   ├── auth/           # JWT, OAuth
│   └── mastra/         # AI実装
├── middleware/
└── shared/             # エラーハンドリング
```

**DDD原則の遵守** (`src/domain/model/schedule.ts`):
```typescript
// エンティティ型
export type ScheduleEntity = Omit<Schedule, "category" | "recurrence"> & {
  userId: string;
  calendarId: string | null;
};

// ファクトリ関数
export const createSchedule = (
  input: CreateScheduleInput,
  userId: string
): ScheduleEntity => { ... };

// 公開用変換
export const toPublicSchedule = (entity: ScheduleEntity): Schedule => { ... };
```

### 2.2 リポジトリパターン (優秀)

**インターフェース** (`src/domain/infra/scheduleRepo.ts`):
```typescript
export type ScheduleRepo = {
  findAllByUserId: (userId: string) => Promise<ScheduleEntity[]>;
  findById: (id: string) => Promise<ScheduleEntity | null>;
  save: (schedule: ScheduleEntity) => Promise<void>;
  update: (schedule: ScheduleEntity) => Promise<void>;
  delete: (id: string) => Promise<void>;
};
```

**実装の差し替えが容易**:
- 本番: Drizzle + D1
- テスト: better-sqlite3 (インメモリ)

### 2.3 依存性注入

**feature単位のDI** (`src/feature/schedule/route.ts`):
```typescript
app.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  const scheduleRepo = createScheduleRepo(db);
  c.set("createSchedule", createCreateScheduleUseCase(scheduleRepo, ...));
  await next();
});
```

**特徴**:
- 各featureが独自にDI設定
- ディレクトリ削除で機能を完全に切り離し可能
- テスト時のモック置き換えが容易

### 2.4 テスト容易性 (8/10)

**テストヘルパー** (`src/test/helpers.ts`):
```typescript
export const createTestDb = () => {
  const sqlite = new Database(":memory:");
  sqlite.exec(`CREATE TABLE IF NOT EXISTS users (...);`);
  return drizzle(sqlite, { schema });
};

export const createTestUser = async (db, data?) => { ... };
export const resetDatabase = async (db) => { ... };
```

**テスト階層**:
- ユースケーステスト: `createSchedule.test.ts`
- 統合テスト: `route.integration.test.ts`

### 2.5 主な課題

| 優先度 | 課題 | 影響 |
|--------|------|------|
| 高 | テストDBスキーマの手動同期 | テスト失敗リスク |
| 高 | AI出力解析の脆弱性 | 複数パターン対応が複雑 |
| 中 | ボイラープレート量 | 新機能追加コスト |
| 中 | ドメインサービス層の不足 | 複雑なビジネスロジックの配置先 |

### 2.6 改善提案

**テストDBスキーマ自動生成**:
```typescript
// schema.tsから自動生成
import * as schema from "../infra/drizzle/schema";

export const createTestDb = () => {
  const sqlite = new Database(":memory:");
  createTablesFromSchema(sqlite, schema); // 自動生成
  return drizzle(sqlite, { schema });
};
```

**AI出力パーサー統一**:
```typescript
export const parseAiOutput = async <T>(
  output: string,
  schema: ZodSchema<T>,
  options?: { maxRetries: number; timeout: number }
): Promise<Result<T>> => {
  // JSON抽出の統一
  // スキーマ検証
  // リトライロジック
};
```

---

## 3. 総合評価

### 3.1 強み

| 領域 | 強み |
|------|------|
| 型安全性 | Zod + TypeScript + Hono RPC |
| データフェッチング | TanStack Query (キャッシング、Optimistic Updates) |
| テスト | Unit + Integration + E2E + Storybook |
| アーキテクチャ | DDD原則、リポジトリパターン |
| 共有コード | @ai-scheduler/shared による一元管理 |

### 3.2 弱み

| 領域 | 弱み |
|------|------|
| フロントエンド状態 | MainApp肥大化、モーダル管理の分散 |
| コンポーネント粒度 | Atomic Design未採用、再利用性低 |
| テストDB同期 | 手動同期が必要 |
| AI統合 | 出力解析がもろい |

### 3.3 拡張性スコア詳細

| 観点 | Frontend | Backend |
|------|----------|---------|
| アーキテクチャ | 6.5 | 8.0 |
| モジュール性 | 7.0 | 7.0 |
| テスト容易性 | 8.0 | 8.0 |
| 新機能追加 | 6.5 | 7.0 |
| **総合** | **6.5** | **7.6** |

---

## 4. 推奨アクション

### 即時対応 (1-2週間)

1. **useModalManager統合** → MainApp簡潔化
2. **テストDBスキーマ自動生成** → テスト信頼性向上
3. **AI出力パーサー統一** → エラー耐性向上

### 中期対応 (1ヶ月)

4. **共通フォームコンポーネント作成** (Input, Select, FormField)
5. **エラーハンドリング統一** (フロントエンド)
6. **DI Container整理** (バックエンド)

### 長期対応

7. **Atomic Design段階的移行**
8. **コード生成ツール作成** (新feature用ボイラープレート)

---

## 5. 重要ファイルパス

### フロントエンド
- `src/components/MainApp.tsx` - メインレイアウト (改善対象)
- `src/hooks/useModalManager.ts` - モーダル管理 (未使用)
- `src/lib/api.ts` - API統合
- `src/hooks/useSchedules.ts` - スケジュール管理hook

### バックエンド
- `src/domain/model/schedule.ts` - エンティティ定義
- `src/domain/infra/scheduleRepo.ts` - リポジトリIF
- `src/feature/schedule/route.ts` - APIルート
- `src/test/helpers.ts` - テストヘルパー (同期必要)

### 共有
- `packages/shared/src/index.ts` - 型・スキーマ共有
