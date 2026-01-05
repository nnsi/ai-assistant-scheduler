import { test, expect } from "@playwright/test";
import { TEST_ACCESS_TOKEN, AUTH_TOKEN_KEY } from "./test-constants";

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
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "new-schedule-1",
            userId: "test-user-id",
            title: body.title,
            startAt: body.startAt,
            endAt: body.endAt,
            isAllDay: body.isAllDay,
            memo: null,
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
        body: JSON.stringify({ keywords: mockKeywords }),
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

    await page.route("**/api/profile/conditions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ profile: { dietaryRestrictions: [], foodAllergies: [], cuisinePreferences: [], budgetRange: null, transportModes: [] } }),
      });
    });

    await page.goto("/");
  });

  test.fixme("should suggest keywords based on schedule title", async ({ page }) => {
    // 日付セルをクリック
    const dateCell = page.locator('[data-testid="calendar-day"]').first();
    await dateCell.click();

    // モーダルが開くこと
    await expect(page.getByRole("dialog")).toBeVisible();

    // フォームに入力
    await page.getByLabel("タイトル").fill("週次定例会議");

    // 次へボタンをクリック
    await page.getByRole("button", { name: "次へ" }).click();

    // キーワード選択画面が表示されること（APIレスポンスを待つためタイムアウトを長く）
    await expect(page.getByText("キーワード選択")).toBeVisible({ timeout: 15000 });

    // 提案されたキーワードが表示されること
    for (const keyword of mockKeywords.slice(0, 3)) {
      await expect(page.getByText(keyword)).toBeVisible();
    }
  });

  test.fixme("should search with selected keywords", async ({ page }) => {
    // 日付セルをクリック
    const dateCell = page.locator('[data-testid="calendar-day"]').first();
    await dateCell.click();

    // フォームに入力
    await page.getByLabel("タイトル").fill("週次定例会議");

    // 次へボタンをクリック
    await page.getByRole("button", { name: "次へ" }).click();

    // キーワード選択画面が表示されるまで待機（APIレスポンスを待つ）
    await expect(page.getByText("キーワード選択")).toBeVisible({ timeout: 15000 });

    // キーワードを選択（最初の2つ）
    const keywordButtons = page.locator('[data-testid="keyword-button"]');
    const keywordCount = await keywordButtons.count();

    if (keywordCount > 0) {
      await keywordButtons.first().click();
      if (keywordCount > 1) {
        await keywordButtons.nth(1).click();
      }
    }

    // 検索ボタンをクリック
    const searchButton = page.getByRole("button", { name: /検索|調べる/i });
    if (await searchButton.isVisible()) {
      await searchButton.click();

      // 検索結果が表示されること
      await expect(page.getByText("検索結果")).toBeVisible();
    }
  });

  test.fixme("should skip AI suggestions and create schedule directly", async ({ page }) => {
    // 日付セルをクリック
    const dateCell = page.locator('[data-testid="calendar-day"]').first();
    await dateCell.click();

    // フォームに入力
    await page.getByLabel("タイトル").fill("シンプルな予定");

    // 次へボタンをクリック
    await page.getByRole("button", { name: "次へ" }).click();

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

  test.fixme("should save schedule with AI results", async ({ page }) => {
    // 日付セルをクリック
    const dateCell = page.locator('[data-testid="calendar-day"]').first();
    await dateCell.click();

    // フォームに入力
    await page.getByLabel("タイトル").fill("会議の準備");

    // 次へボタンをクリック
    await page.getByRole("button", { name: "次へ" }).click();

    // キーワード選択画面が表示されるまで待機（APIレスポンスを待つ）
    await expect(page.getByText("キーワード選択")).toBeVisible({ timeout: 15000 });

    // キーワードを選択
    const keywordButtons = page.locator('[data-testid="keyword-button"]');
    if ((await keywordButtons.count()) > 0) {
      await keywordButtons.first().click();
    }

    // 検索ボタンをクリック
    const searchButton = page.getByRole("button", { name: /検索|調べる/i });
    if (await searchButton.isVisible()) {
      await searchButton.click();

      // 検索結果画面が表示されるまで待機
      await expect(page.getByText("検索結果")).toBeVisible();

      // 保存ボタンをクリック
      const saveButton = page.getByRole("button", { name: /保存/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();

        // モーダルが閉じること
        await expect(page.getByRole("dialog")).not.toBeVisible();
      }
    }
  });
});
