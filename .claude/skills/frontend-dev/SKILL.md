---
name: frontend-dev
description: フロントエンド開発ガイド。core/frontendパッケージ構造、React開発Tips、テスト方法。
---

# フロントエンド開発ガイド

フロントエンド（React/Vite）の開発手順とベストプラクティス。

## パッケージ構造

```
packages/
├── shared/        # 共有型定義・Zodスキーマ
├── core/          # ビジネスロジック（Web/RN共通）
│   ├── api/       # APIクライアント
│   ├── hooks/     # カスタムフック
│   ├── contexts/  # Context（Storage DI対応）
│   ├── utils/     # ユーティリティ
│   └── storage/   # Storage抽象化インターフェース
└── frontend/      # Web固有の実装
    ├── components/  # UIコンポーネント
    ├── routes/      # TanStack Routerルート
    ├── contexts/    # Web用Contextラッパー
    └── storage.ts   # localStorage実装
```

## 3層アーキテクチャ

coreパッケージは3層構造でコードを整理している。

```
1. ビジネスロジック（純粋TS）
   └── core/api/client.ts        ... API呼び出し関数

2. ビジネスロジックHooks（apiをラップ、キャッシュ管理）
   └── core/hooks/useSchedules.ts      ... create(), update(), remove()
   └── core/hooks/useScheduleSearch.ts ... 検索
   └── core/hooks/useRecurrence.ts     ... 繰り返しルール管理
   └── core/hooks/useSupplements.ts    ... お店選択、メモ
   └── core/hooks/useAI.ts             ... AI機能
   └── core/hooks/useCategories.ts
   └── core/hooks/useProfile.ts

3. UIロジックHooks（ビジネスロジックHooksを組み合わせ、UI状態を管理）
   └── core/hooks/useScheduleFormModal.ts  ... ウィザードのstep管理
   └── core/hooks/useSearchModal.ts        ... 検索フィルター状態

4. UI（UIロジックHooksを呼び出し、描画のみ）
   └── frontend/components/...
```

### ルール

**UIロジックHooksはapiを直接呼ばない**:

```typescript
// NG: UIロジックhookがapi直接呼び出し
import * as api from "../api";
const schedule = await api.createSchedule(data);

// OK: ビジネスロジックhook経由
import { useSchedules } from "./useSchedules";
const { create } = useSchedules();
const schedule = await create(data);
```

**理由**:
- ビジネスロジックHooksがTanStack Queryでキャッシュ管理
- UIロジックHooksは状態管理・ハンドラーに専念
- mobileパッケージでもUIロジックHooksをそのまま再利用可能

### 新しいUIロジックHookの作り方

```typescript
// packages/core/src/hooks/useMyModal.ts
export function useMyModal(config: UseMyModalConfig) {
  // 1. ビジネスロジックHooksを使う
  const { create } = useSchedules();
  const { categories } = useCategories();

  // 2. UI状態を管理
  const [step, setStep] = useState<Step>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3. ハンドラーを定義（ビジネスロジックhookを呼ぶ）
  const handleSubmit = useCallback(async (data) => {
    setIsSubmitting(true);
    try {
      await create(data);  // ← hook経由
    } finally {
      setIsSubmitting(false);
    }
  }, [create]);

  // 4. UIに必要なものだけ返す
  return { step, isSubmitting, categories, handleSubmit };
}
```

## 開発フロー

### 1. 新しいフック/ユーティリティを追加する場合

**coreパッケージに追加**（Web/RN共通で使える場合）:

```typescript
// packages/core/src/hooks/useNewFeature.ts
export const useNewFeature = () => {
  // 実装
};

// packages/core/src/hooks/index.ts に export を追加
export { useNewFeature } from "./useNewFeature";
```

**frontendでcoreを使う**:

```typescript
import { useNewFeature } from "@ai-scheduler/core/hooks";
```

### 2. 新しいAPIエンドポイントを呼ぶ場合

```typescript
// packages/core/src/api/newFeature.ts
import { fetchWithAuth } from "./client";

export const fetchNewFeature = async (id: string) => {
  return fetchWithAuth(`/api/new-feature/${id}`);
};

// packages/core/src/api/index.ts に export を追加
```

### 3. Storage を使う場合

Contextを通じてStorageにアクセスする（直接localStorageを使わない）:

```typescript
// coreのContextはconfigでStorageを受け取る
export type MyProviderConfig = {
  storage: Storage & SyncStorage;
};

// frontendでWeb用storageを注入
import { storage } from "../storage";
<MyProvider config={{ storage }}>{children}</MyProvider>
```

## React 18 Strict Mode

- `useEffect`内で直接API通信を行わない（二重実行される）
- データフェッチングには`TanStack Query`（React Query）を使う
- 一度きりの処理（OAuth認証コールバック等）は`useRef`で二重実行を防止

```typescript
// 悪い例
useEffect(() => {
  fetch('/api/data').then(...)
}, []);

// 良い例（React Query）
const { data } = useQuery({ queryKey: ['data'], queryFn: fetchData });

// 良い例（一度きりの処理）
const isProcessingRef = useRef(false);
useEffect(() => {
  if (isProcessingRef.current) return;
  isProcessingRef.current = true;
  // 処理...
}, []);
```

## TanStack Router

- `beforeLoad`はナビゲーション時にしか実行されない
- 認証状態が変わったときは`router.invalidate()`を呼ぶ必要がある

```typescript
// 認証状態が変化したらルーターを再評価
useEffect(() => {
  if (prev.isAuthenticated !== isAuthenticated) {
    router.invalidate();
  }
}, [isAuthenticated]);
```

## Hono RPC Clientの制限

- 全てのルートで型推論できるわけではない
- パスパラメータを含むルートで型推論が効かない場合がある
- fallbackとして`fetchWithAuth`を直接使う

```typescript
// Hono RPCで型推論できる場合
const res = await client.schedules.$get();

// 型推論できない場合のfallback
const res = await fetchWithAuth(`/api/invitations/${token}`);
```

## 空配列へのフォールバック

`??`演算子は`null`/`undefined`のみフォールバックし、空配列`[]`はそのまま通過する。

```typescript
// NG: []の場合フォールバックしない
const items = agentTypes ?? ["search"]; // agentTypes=[] → []

// OK: 空配列もフォールバック
const items = agentTypes?.length ? agentTypes : ["search"];
```

## カレンダーフィルタリングの注意

`calendarId = null`のスケジュールは、選択されたカレンダーでフィルタリングすると除外される。
既存データにcalendarIdがない場合はマイグレーションでデフォルトカレンダーを紐付ける。

## 複数ブラウザでの確認

CSSやJavaScriptの位置計算は、ブラウザ間で差異が出やすい。Chrome以外（Firefox、Safari）でも確認する。

特に以下のケースはブラウザ間で挙動が異なる可能性がある：
- absoluteポジションの位置計算（pxベースよりパーセンテージベースの方が安定）
- CSS Gridの挙動
- スクロールバーの幅

## テスト

### ユニットテスト

```bash
# フロントエンドテスト
pnpm --filter @ai-scheduler/frontend test
```

テストでAPIをモックする場合:

```typescript
// @ai-scheduler/core/api をモック（旧 @/lib/api ではない）
vi.mock("@ai-scheduler/core/api", () => ({
  fetchSchedules: vi.fn(),
  createSchedule: vi.fn(),
}));
```

### E2Eテスト

```bash
# E2Eテスト
pnpm --filter @ai-scheduler/frontend test:e2e
```

**新しいAPIエンドポイントを追加したら**:
1. E2Eテストに対応するモックを追加
2. Zodスキーマの必須フィールドがモックに全て含まれているか確認
3. `nullable`と`optional`の違いに注意（`null` vs `undefined`）

**Playwrightでテストが失敗したときのデバッグ**:

```typescript
// ブラウザコンソールのエラーを確認
page.on("console", msg => console.log(msg.text()));

// スクリーンショットを撮ってから操作
await page.screenshot({ path: 'debug.png' });
```

## 型チェック

```bash
# coreパッケージ
pnpm --filter @ai-scheduler/core typecheck

# frontendパッケージ
pnpm --filter @ai-scheduler/frontend typecheck
```

## デバッグ時の仮説検証

「APIは正しいのに表示されない」場合は、フロントエンドのフィルタリング・レンダリングを疑う。

```
1. APIが正しいデータを返しているか確認 → ✓
2. データが返っているのに表示されない → フロントエンドの問題
3. フィルタリング、レンダリングロジックを確認
```

## 完了チェックリスト

- [ ] coreに追加した場合、index.tsからexportしている
- [ ] フロントエンドテストが通る
- [ ] E2Eテストが通る
- [ ] 型エラーがない
- [ ] Chrome以外のブラウザでも確認した（必要に応じて）
