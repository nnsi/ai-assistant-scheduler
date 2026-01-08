---
name: e2e-test-maintenance
description: E2Eテストの修正・メンテナンス。テストが失敗したときのデバッグ、モック同期、新機能のテスト追加。
---

# E2Eテストメンテナンス

E2Eテストが失敗したとき、または新機能のテストを追加するときの手順。

## テスト失敗時のデバッグ

### 1. エラーの確認

まずテストを実行して、どのテストが失敗しているか確認：

```bash
cd packages/frontend && pnpm test:e2e
```

### 2. ブラウザコンソールの確認

テストファイルに以下を追加して、ブラウザコンソールのエラーを確認：

```typescript
test.beforeEach(async ({ page }) => {
  page.on("console", msg => console.log("Browser:", msg.text()));
  page.on("pageerror", err => console.log("Page error:", err.message));
});
```

### 3. よくある原因

| エラーメッセージ | 原因 | 対処法 |
|---|---|---|
| `Invalid response format` + Zod error | モックのレスポンスにフィールドが足りない | Zodスキーマを確認し、モックを更新 |
| `Timeout` | セレクタが見つからない | ボタン名変更等を確認、スクリーンショットで確認 |
| 404エラー | 新しいAPIにモックがない | `page.route()`でモックを追加 |

### 4. Zodスキーマとの同期

モックレスポンスを作成するときの注意：

```typescript
// 悪い例: nullableフィールドにundefinedを渡す
{ endAt: body.endAt } // body.endAtがundefinedだとZodエラー

// 良い例: nullableにはnullを渡す
{ endAt: body.endAt ?? null }
```

スキーマの定義を確認：
- `z.string().nullable()` → `null` を渡す
- `z.string().optional()` → 省略可能
- `z.string()` → 必須

## 新機能のテスト追加

### 1. APIモックの追加

新しいエンドポイントを追加したら、E2Eテストにモックを追加：

```typescript
// 例: /api/calendars のモック
await page.route("**/api/calendars", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([{ id: "cal-1", name: "Default", ... }]),
  });
});
```

### 2. ルートパターンの優先度

Playwrightのルートパターンは、具体的なものから順にマッチする：

```typescript
// これらは別々に設定が必要
await page.route("**/api/schedules/*", ...);    // /api/schedules/123
await page.route("**/api/schedules?*", ...);   // /api/schedules?year=2026
await page.route("**/api/schedules", ...);     // /api/schedules (POST)
```

### 3. 共通モックの切り出し

複数のテストで使うモックは関数化：

```typescript
// helpers.ts
export async function setupCalendarMocks(page: Page) {
  await page.route("**/api/calendars", async (route) => { ... });
  await page.route("**/api/categories", async (route) => { ... });
}

// テストファイル
test.beforeEach(async ({ page }) => {
  await setupCalendarMocks(page);
});
```

## デバッグテクニック

### スクリーンショット

要素をクリックする前に視覚的に確認：

```typescript
await page.screenshot({ path: "debug.png" });
```

### アクセシビリティスナップショット

ボタンの識別が難しい場合：

```typescript
const snapshot = await page.accessibility.snapshot();
console.log(JSON.stringify(snapshot, null, 2));
```

### テストの一時停止

```typescript
await page.pause(); // ブラウザを開いたまま停止
```

## チェックリスト

新機能を追加した後：

- [ ] 新しいAPIエンドポイントのモックを追加
- [ ] Zodスキーマの必須フィールドがモックに含まれている
- [ ] ボタン名やラベルが変更されていたらセレクタを更新
- [ ] 既存のテストが全てパスする
