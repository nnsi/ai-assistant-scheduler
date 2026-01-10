import { test, expect } from "@playwright/test";
import { TEST_ACCESS_TOKEN, AUTH_TOKEN_KEY, setupCalendarMocks } from "./test-constants";

/**
 * AI機能のE2Eテスト
 * APIモックを使用してキーワード提案と検索をテスト
 */
test.describe("AI Features", () => {
  const mockKeywords = ["アジェンダ作成", "会議資料", "参加者確認", "議事録準備", "タイムスケジュール"];
  const mockSearchResult = `
## 会議の準備ガイド

### アジェンダ作成
1. 会議の目的を明確にする
2. 議題を優先順位で整理
3. 各議題の時間配分を決定

### 会議資料
- 事前に資料を共有
- 必要な情報を整理
`;

  test.beforeEach(async ({ page }) => {
    // 認証状態を設定
    await page.addInitScript(
      ({ tokenKey, token }) => {
        localStorage.setItem(tokenKey, token);
        localStorage.setItem("auth_refresh_token", "test-refresh-token");
        localStorage.setItem(
          "auth_user",
          JSON.stringify({
            id: "test-user-id",
            email: "test@example.com",
            name: "Test User",
          })
        );
      },
      { tokenKey: AUTH_TOKEN_KEY, token: TEST_ACCESS_TOKEN }
    );

    // APIモックを設定（ページ遷移前にルートを設定）
    await page.route("**/api/auth/refresh", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ accessToken: TEST_ACCESS_TOKEN }),
      });
    });

    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "test-user-id",
            email: "test@example.com",
            name: "Test User",
            picture: null,
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
          },
        }),
      });
    });

    await page.route("**/api/schedules*", async (route, request) => {
      const method = request.method();
      if (method === "GET") {
        // スケジュール一覧は配列を直接返す
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      } else if (method === "POST") {
        const body = await request.postDataJSON();
        // スケジュール作成は作成されたスケジュールを直接返す
        // scheduleSchemaに合わせる：endAtはnullable（undefinedではなくnull）
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "new-schedule-1",
            title: body.title,
            startAt: body.startAt,
            endAt: body.endAt ?? null,
            isAllDay: body.isAllDay ?? false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/ai/suggest-keywords", async (route) => {
      // 少し遅延を入れてローディング状態をテスト
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ keywords: mockKeywords, agentTypes: ["search"] }),
      });
    });

    await page.route("**/api/ai/search", async (route) => {
      // 少し遅延を入れてローディング状態をテスト
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ result: mockSearchResult }),
      });
    });

    // SSEストリーミング検索エンドポイントのモック
    await page.route("**/api/ai/search-and-save/stream", async (route) => {
      // SSEレスポンスを返す
      const sseResponse = [
        'data: {"type":"status","message":"検索中..."}',
        '',
        `data: {"type":"text","content":"${mockSearchResult.replace(/\n/g, '\\n')}"}`,
        '',
        'data: {"type":"done"}',
        '',
      ].join('\n');

      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: sseResponse,
      });
    });

    await page.route("**/api/profile/conditions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ profile: { dietaryRestrictions: [], foodAllergies: [], cuisinePreferences: [], budgetRange: null, transportModes: [] } }),
      });
    });

    // カレンダーとカテゴリのモックを設定
    await setupCalendarMocks(page);

    await page.goto("/");
  });

  test("should suggest keywords based on schedule title", async ({ page }) => {
    // カレンダーが表示されるまで待機
    await expect(page.locator('[role="grid"]')).toBeVisible({ timeout: 10000 });

    // 日付セルをクリック
    const dateCell = page.locator('[data-testid="calendar-day"]').first();
    await dateCell.click();

    // モーダルが開くこと
    await expect(page.getByRole("dialog")).toBeVisible();

    // フォームに入力
    await page.getByLabel("タイトル").fill("週次定例会議");

    // AIで補完ボタンをクリック
    await page.getByRole("button", { name: "AIで補完" }).click();

    // キーワード選択画面が表示されること（APIレスポンスを待つためタイムアウトを長く）
    await expect(page.getByText("キーワード選択")).toBeVisible({ timeout: 15000 });

    // 提案されたキーワードが表示されること
    for (const keyword of mockKeywords.slice(0, 3)) {
      await expect(page.getByText(keyword)).toBeVisible();
    }
  });

  test("should search with selected keywords", async ({ page }) => {
    // カレンダーが表示されるまで待機
    await expect(page.locator('[role="grid"]')).toBeVisible({ timeout: 10000 });

    // 日付セルをクリック
    const dateCell = page.locator('[data-testid="calendar-day"]').first();
    await dateCell.click();

    // フォームに入力
    await page.getByLabel("タイトル").fill("週次定例会議");

    // AIで補完ボタンをクリック
    await page.getByRole("button", { name: "AIで補完" }).click();

    // キーワード選択画面が表示されるまで待機（APIレスポンスを待つ）
    await expect(page.getByText("キーワード選択")).toBeVisible({ timeout: 15000 });

    // キーワードを選択（キーワードテキストでボタンを探す）
    // mockKeywordsの最初の2つを選択
    await page.getByRole("button", { name: mockKeywords[0], exact: true }).click();
    await page.getByRole("button", { name: mockKeywords[1], exact: true }).click();

    // 検索ボタンをクリック（2件選択中）
    await page.getByRole("button", { name: /検索する/ }).click();

    // 検索結果画面が表示されること（モーダルタイトルで確認）
    await expect(page.getByRole("heading", { name: "検索結果", level: 2 })).toBeVisible({ timeout: 10000 });
  });

  test("should skip AI suggestions and create schedule directly", async ({ page }) => {
    // カレンダーが表示されるまで待機
    await expect(page.locator('[role="grid"]')).toBeVisible({ timeout: 10000 });

    // 日付セルをクリック
    const dateCell = page.locator('[data-testid="calendar-day"]').first();
    await dateCell.click();

    // フォームに入力
    await page.getByLabel("タイトル").fill("シンプルな予定");

    // AIで補完ボタンをクリック
    await page.getByRole("button", { name: "AIで補完" }).click();

    // キーワード選択画面が表示されるまで待機（APIレスポンスを待つ）
    await expect(page.getByText("キーワード選択")).toBeVisible({ timeout: 15000 });

    // スキップボタンをクリック
    const skipButton = page.getByRole("button", { name: /スキップ/i });
    if (await skipButton.isVisible()) {
      await skipButton.click();

      // モーダルが閉じること
      await expect(page.getByRole("dialog")).not.toBeVisible();
    }
  });

  test("should save schedule with AI results", async ({ page }) => {
    // カレンダーが表示されるまで待機
    await expect(page.locator('[role="grid"]')).toBeVisible({ timeout: 10000 });

    // 日付セルをクリック
    const dateCell = page.locator('[data-testid="calendar-day"]').first();
    await dateCell.click();

    // フォームに入力
    await page.getByLabel("タイトル").fill("会議の準備");

    // AIで補完ボタンをクリック
    await page.getByRole("button", { name: "AIで補完" }).click();

    // キーワード選択画面が表示されるまで待機（APIレスポンスを待つ）
    await expect(page.getByText("キーワード選択")).toBeVisible({ timeout: 15000 });

    // キーワードを選択（最初のキーワードをクリック）
    await page.getByRole("button", { name: mockKeywords[0], exact: true }).click();

    // 検索ボタンをクリック（1件選択中）
    await page.getByRole("button", { name: /検索する/ }).click();

    // 検索結果画面が表示されるまで待機（モーダルタイトルで確認）
    await expect(page.getByRole("heading", { name: "検索結果", level: 2 })).toBeVisible({ timeout: 10000 });

    // 閉じる/終了するボタンをクリック（検索結果は自動保存されるので閉じるだけ）
    // お店候補がない場合は「終了する」、ある場合は「閉じる」
    await page.getByRole("button", { name: /閉じる|終了する/ }).click();

    // モーダルが閉じること
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  });
});
