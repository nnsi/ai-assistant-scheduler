import { test, expect } from "@playwright/test";
import { TEST_ACCESS_TOKEN, AUTH_TOKEN_KEY, setupCalendarMocks } from "./test-constants";

test.describe("Schedule Management", () => {
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

    // APIモックを設定
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
        // スケジュール作成は作成されたスケジュールを直接返す
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "new-schedule-1",
            title: "新しい予定",
            startAt: "2025-01-15T10:00:00+09:00",
            endAt: "2025-01-15T11:00:00+09:00",
            isAllDay: false,
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/ai/suggest-keywords", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ keywords: ["キーワード1", "キーワード2", "キーワード3"] }),
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

  test("should display calendar with current month", async ({ page }) => {
    // カレンダーヘッダーが表示されていること
    await expect(page.locator("header")).toContainText("AI Scheduler");

    // カレンダーが表示されていること
    const calendar = page.locator('[role="grid"]');
    await expect(calendar).toBeVisible();

    // 曜日ヘッダーが表示されていること（exact: trueで部分一致を避ける）
    await expect(page.getByText("日", { exact: true })).toBeVisible();
    await expect(page.getByText("月", { exact: true })).toBeVisible();
    await expect(page.getByText("火", { exact: true })).toBeVisible();
    await expect(page.getByText("水", { exact: true })).toBeVisible();
    await expect(page.getByText("木", { exact: true })).toBeVisible();
    await expect(page.getByText("金", { exact: true })).toBeVisible();
    await expect(page.getByText("土", { exact: true })).toBeVisible();
  });

  test("should navigate between months", async ({ page }) => {
    // 現在の月を取得
    const monthDisplay = page.locator("h2");
    const initialMonth = await monthDisplay.textContent();

    // 次へ移動
    await page.getByRole("button", { name: "次へ" }).click();
    await expect(monthDisplay).not.toHaveText(initialMonth || "");

    // 前へ移動
    await page.getByRole("button", { name: "前へ" }).click();
    await expect(monthDisplay).toHaveText(initialMonth || "");
  });

  test("should open schedule creation modal on date click", async ({ page }) => {
    // 日付セルをクリック
    const dateCell = page.locator('[data-testid="calendar-day"]').first();
    await dateCell.click();

    // モーダルが開くこと
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("新しい予定を作成");
  });

  test("should fill schedule form", async ({ page }) => {
    // 日付セルをクリック
    const dateCell = page.locator('[data-testid="calendar-day"]').first();
    await dateCell.click();

    // モーダルが開くこと
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // フォームに入力
    await page.getByLabel("タイトル").fill("E2Eテストの予定");

    // AIで補完ボタンが表示されていること（APIモックが必要なため、この段階ではフォーム入力まで確認）
    const submitButton = page.getByRole("button", { name: "AIで補完" });
    await expect(submitButton).toBeVisible();
  });

  test("should close modal on cancel", async ({ page }) => {
    // 日付セルをクリック
    const dateCell = page.locator('[data-testid="calendar-day"]').first();
    await dateCell.click();

    // モーダルが開くこと
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // キャンセルボタンをクリック
    await page.getByRole("button", { name: "キャンセル" }).click();

    // モーダルが閉じること
    await expect(modal).not.toBeVisible();
  });

  test("should navigate to today", async ({ page }) => {
    // 次へ移動（2回クリック）
    await page.getByRole("button", { name: "次へ" }).click();
    await page.getByRole("button", { name: "次へ" }).click();

    // 今日ボタンをクリック
    await page.getByRole("button", { name: "今日" }).click();

    // 現在の月に戻ること（今日の日付が含まれる月が表示される）
    const today = new Date();
    const expectedMonth = `${today.getFullYear()}年${today.getMonth() + 1}月`;
    await expect(page.locator("h2")).toContainText(expectedMonth);
  });
});
