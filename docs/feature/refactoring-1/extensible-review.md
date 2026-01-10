# AI Assistant Scheduler 拡張性評価レポート

**評価日**: 2026-01-10
**評価者**: Claude Code (Explore Agent) + Codex
**対象**: packages/backend, packages/frontend, packages/shared

---

## エグゼクティブサマリー

| 対象 | 総合評価 | 強み | 改善優先度 |
|------|---------|------|-----------|
| Backend API | ★★★★☆ | レイヤー分離、型安全性、リポジトリパターン | エラーハンドリング統一 |
| Frontend | ★★★☆☆ | TanStack Query活用、API型安全性 | ルーティング導入、App.tsx分割 |
| Shared | ★★★★☆ | Zodスキーマ共有、単一ソース化 | 用途別ディレクトリ分割 |

**両評価者が一致した主要な指摘**:
- バックエンドのDI/エラーハンドリングが各ルートに分散（※DI分散は意図的な設計判断、後述）
- フロントエンドのルーティングが手動実装で拡張性に課題
- 共有スキーマの責務境界が曖昧になる可能性

---

## 1. バックエンド API の拡張性

### 1.1 アーキテクチャ構造

**ディレクトリ設計** (★★★★☆)

```
packages/backend/src/
├── domain/
│   ├── infra/        # リポジトリインターフェース
│   └── model/        # ドメインエンティティ
├── feature/          # フィーチャー単位 (route + usecase)
├── infra/
│   ├── drizzle/      # リポジトリ実装
│   ├── auth/         # JWT, OAuth
│   └── mastra/       # AI関連
├── middleware/       # 認証、レート制限
└── shared/           # エラーハンドリング
```

**評価ポイント**:
- DDD的なレイヤー分離が明確（domain → infra → feature）
- フィーチャー指向で新機能追加が容易
- リポジトリパターンによるDB実装の差し替え可能性

### 1.2 ルーティングとミドルウェア (★★★★★)

```typescript
// feature単位での統合
export const apiRoutes = app
  .route("/auth", authRoute)
  .route("/schedules", scheduleRoute)
  .route("/calendars", calendarRoute);
```

**強み**:
- Honoフレームワークの軽量設計
- 新規エンドポイント追加は `feature/XXX/route.ts` 作成 → `route.ts` に登録のみ
- 認証ミドルウェア (`authMiddleware`) の一元管理

**課題**:
- バリデーションエラー処理がエンドポイント毎にボイラープレート

### 1.3 データベース層 (★★★★★)

```typescript
// インターフェース定義 (domain/infra)
export type ScheduleRepo = {
  findAllByUserId: (userId: string) => Promise<ScheduleEntity[]>;
  save: (schedule: ScheduleEntity) => Promise<void>;
};

// 実装 (infra/drizzle)
export const createScheduleRepo = (db: Database): ScheduleRepo => ({
  findAllByUserId: async (userId) => { /* ... */ },
});
```

**強み**:
- Drizzle ORMによる型安全なDB操作
- リポジトリインターフェースと実装の分離
- Entity変換ロジックが明確

### 1.4 問題点と改善提案

| 問題 | 重大度 | 改善案 |
|------|--------|--------|
| validation処理のボイラープレート | 中 | 共通ミドルウェアユーティリティ作成 |
| テストDBスキーマの手動同期 | 中 | schema.tsからDDL自動生成 |
| エラーハンドリングが手動的 | 中 | グローバルエラーハンドラ (`app.onError`) 導入 |
| JOINロジックの重複 | 低 | 共通変換関数の抽出 |
| DI重複（毎リクエストでDB生成） | 低 | 規模拡大時に検討（後述: 1.5参照） |

### 1.5 DI設計に関する検討

#### 現状: feature分散型DI

各featureが独自にDI設定を持つ現在の設計について、一元化との比較検討を行った。

**トレードオフ分析**:

| 観点 | 一元化 | feature分散（現状） |
|------|--------|-------------------|
| ボイラープレート | 少ない | 多い |
| **捨てやすさ** | container修正必要 | **ディレクトリ削除で完結** |
| 依存グラフ | 中央に集約 | 各featureで閉じる |
| 新メンバーの理解 | container読む必要あり | featureだけ見れば完結 |
| パターン変更時 | 1箇所修正 | 全feature修正 |

**AIコード生成時のコスト分析**:

| コスト種別 | 人間が書く | AIが生成 |
|-----------|----------|---------|
| 書く | 高 | ≒0 |
| 読む/理解する | 中 | 中（コンテキスト消費） |
| パターン変更時の修正 | 高 | 中（全箇所確認は必要） |
| 一貫性維持 | 高 | 中（時間経過で分岐リスク） |

**結論**:

現在の規模（5-6 feature）では、**捨てやすさ**のメリットがボイラープレートのデメリットを上回る。AIがコード生成する場合、「書く」コストはほぼゼロだが、「変更時の横展開」や「一貫性維持」のコストは残る。

- **現時点**: feature分散を維持
- **10+ feature到達時**: 一元化を再検討
- **パターン変更が頻発する場合**: 一元化を検討

**一元化する場合の実装例**（将来参考用）:
```typescript
// src/infra/container.ts
export const createContainer = (env: Bindings) => {
  const db = createDb(env.DB);
  return {
    scheduleRepo: createScheduleRepo(db),
    calendarRepo: createCalendarRepo(db),
  };
};

// root middleware
app.use("*", async (c, next) => {
  c.set("container", createContainer(c.env));
  await next();
});
```

---

## 2. フロントエンドの拡張性

### 2.1 アーキテクチャ構造 (★★★★☆)

```
packages/frontend/src/
├── components/         # 機能別ディレクトリ分割
│   ├── AI/
│   ├── Calendar/
│   ├── Schedule/
│   └── common/
├── contexts/          # React Context
├── hooks/             # カスタムフック
├── lib/               # API、ユーティリティ
└── test/
```

**強み**:
- 機能別の明確なディレクトリ分割
- 共有コンポーネント（common）の適切な分離

**課題**:
- App.tsxが多くのモーダル状態を直接管理（342行、13個以上の状態）

### 2.2 状態管理 (★★★★☆)

**TanStack Query活用**:
```typescript
export const useSchedules = (year?: number, month?: number) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [SCHEDULES_QUERY_KEY, year, month],
    queryFn: () => api.fetchSchedules(year, month),
  });
  // Optimistic Updates実装済み
};
```

**強み**:
- キャッシング戦略が適切（staleTime: 5分）
- Optimistic Updatesの実装
- Query/Mutationの統一されたAPI

**課題**:
- `useAI`フックの状態が複雑（11個のuseState）
- グローバルトークン管理がグローバル変数使用

### 2.3 ルーティング (★★☆☆☆)

**現状の問題**:
```typescript
// App.tsx - 手動パスマッチング
if (window.location.pathname === "/auth/callback") {
  return <AuthCallback />;
}
if (window.location.pathname.startsWith("/invite/")) {
  return <InvitationAcceptPage />;
}
```

**課題**:
- React Router / TanStack Router 未使用
- ページ追加のたびにApp.tsx修正が必要
- 認証ガードがシンプルすぎる（ロール別制御なし）

### 2.4 API連携 (★★★★★)

```typescript
// Hono RPC Clientによる型安全なAPI呼び出し
const client = hc<ApiRoutes>(API_BASE_URL, { fetch: fetchWithAuth });

// Zodスキーマによる実行時検証
async function handleResponse<T>(res: Response, schema: z.ZodType<T>): Promise<T> {
  const result = schema.safeParse(await res.json());
  if (!result.success) throw new Error(`Invalid response: ${result.error.message}`);
  return result.data;
}
```

**強み**:
- エンドポイントの型推論
- 401エラー時の自動トークンリフレッシュ
- SSEサポート（StreamEvent型）

### 2.5 問題点と改善提案

| 問題 | 重大度 | 改善案 |
|------|--------|--------|
| 手動パスマッチング | 高 | React Router / TanStack Router 導入 |
| App.tsxの肥大化 | 高 | モーダル状態管理を useReducer / Zustand に委譲 |
| useAIフックの複雑さ | 中 | ストリーミング状態の分離設計 |
| CalendarContextの二重同期 | 中 | useSyncExternalStore 利用検討 |
| Hono RPC型推論の制限 | 中 | パスパラメータ用カスタムジェネリック |

**改善例: ルーティング導入**
```typescript
// router.tsx
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  { path: '/', element: <MainApp />, loader: requireAuth },
  { path: '/auth/callback', element: <AuthCallback /> },
  { path: '/invite/:token', element: <InvitationAcceptPage /> },
]);
```

---

## 3. 共有コード (packages/shared)

### 3.1 現状評価 (★★★★☆)

**強み**:
- Zodスキーマが単一ソースとして機能
- API入力/出力の型安全性をバック/フロントで共有
- `ErrorCode`/`ApiError`の共有で全体のエラー整合性

**課題**:
- API契約・ドメインモデル・UI入力型が同居
- 将来的に"契約"と"内部"の境界が曖昧になりやすい

### 3.2 改善提案

```
packages/shared/
├── schemas/
│   ├── api/       # API契約（リクエスト/レスポンス）
│   └── domain/    # ドメインモデル
└── errors/        # 共通エラー定義
```

---

## 4. 評価者間の比較

### 4.1 一致した指摘（信頼度: 高）

| 指摘内容 | Explore Agent | Codex |
|---------|---------------|-------|
| バックエンドのDI分散 | ○ | ○ |
| フロントエンドのルーティング課題 | ○ | ○ |
| API層（lib/api.ts）の肥大化傾向 | ○ | ○ |
| 共有スキーマの責務境界 | ○ | ○ |
| TanStack Queryの適切な活用 | ○ | ○ |

### 4.2 差異がある評価

| 観点 | Explore Agent | Codex |
|------|---------------|-------|
| バックエンドエラーハンドリング | 手動対応が多い（改善必要） | Result型パターンで安全 |
| App.tsxの問題 | 詳細に指摘（13個のstate） | 言及なし |
| rrule.js導入 | 推奨 | 言及なし |

---

## 5. 優先改善ロードマップ

### Phase 1: 必須（拡張性のボトルネック解消）

1. **フロントエンド: ルーターライブラリ導入**
   - React Router または TanStack Router
   - 認証ガードの体系化
   - ページ追加フローの標準化

### Phase 2: 推奨（保守性向上）

2. **フロントエンド: App.tsx分割**
   - モーダル状態管理の分離
   - useReducer または Zustand 導入

3. **バックエンド: グローバルエラーハンドラ**
   - `app.onError` での統一エラー処理
   - Result型との連携

4. **共有: スキーマディレクトリ分割**
   - `schemas/api` と `schemas/domain` の分離

### Phase 3: オプション（将来の拡張準備）

5. useAIフックのリファクタリング
6. テストDBスキーマの自動同期
7. rrule.jsによる繰り返しロジック置換

### Phase 4: 規模拡大時（10+ feature到達時）

8. **バックエンド: DI一元化の再検討**
   - 詳細は「1.5 DI設計に関する検討」を参照
   - 判断基準: feature数、パターン変更頻度、チーム規模

---

## 6. 新規フィーチャー追加ガイド

### バックエンド: 新規APIエンドポイント追加

```bash
# 1. リポジトリインターフェース
packages/backend/src/domain/infra/notificationRepo.ts

# 2. ドメインエンティティ
packages/backend/src/domain/model/notification.ts

# 3. DBスキーマ追加
packages/backend/src/infra/drizzle/schema.ts

# 4. リポジトリ実装
packages/backend/src/infra/drizzle/notificationRepo.ts

# 5. テストスキーマ同期（重要）
packages/backend/test/helpers.ts

# 6. ユースケース
packages/backend/src/feature/notification/usecase/

# 7. ルート定義
packages/backend/src/feature/notification/route.ts

# 8. ルート登録
packages/backend/src/route.ts
```

### フロントエンド: 新規ページ追加（ルーター導入後）

```bash
# 1. ページコンポーネント
packages/frontend/src/pages/NotificationPage.tsx

# 2. API関数追加
packages/frontend/src/lib/api.ts

# 3. カスタムフック
packages/frontend/src/hooks/useNotifications.ts

# 4. ルート定義追加
packages/frontend/src/router.tsx
```

---

## 7. 結論

本プロジェクトは **中〜高程度の拡張性** を持つ堅実な設計です。

**現時点で問題なく拡張できる領域**:
- 新規APIエンドポイントの追加
- 新規コンポーネントの追加
- 新規Zodスキーマの追加

**拡張前に改善が必要な領域**:
- 新規ページの追加（ルーター導入が必要）
- 大規模なモーダル追加（App.tsx分割が必要）

**意図的に現状維持する設計判断**:
- バックエンドのDI分散: 「捨てやすさ」を優先し、feature単位での独立性を維持
- 10+ feature到達時に一元化を再検討

現在の規模（バックエンド約50ファイル、フロントエンド約45コンポーネント）では十分対応可能ですが、**100+ファイル/コンポーネント規模**への成長を見据える場合、Phase 1（ルーター導入）を先行して実施することを推奨します。
