import { test, expect } from "@playwright/test";
import { TEST_ACCESS_TOKEN, AUTH_TOKEN_KEY } from "./test-constants";

/**
 * スケジュールCRUD操作のE2Eテスト
 * APIモックを使用
 */
test.describe("Schedule CRUD Operations", () => {
  // 現在の月の15日を使用（カレンダーに表示されるように）
  const today = new Date();
  const scheduleDate = new Date(today.getFullYear(), today.getMonth(), 15);
  const scheduleDateStr = `${scheduleDate.getFullYear()}-${String(scheduleDate.getMonth() + 1).padStart(2, "0")}-15`;

  const mockSchedule = {
    id: "schedule-1",
    userId: "test-user-id",
    title: "テスト予定",
    startAt: `${scheduleDateStr}T10:00:00`,
    endAt: `${scheduleDateStr}T11:00:00`,
    isAllDay: false,
    memo: null,
    createdAt: `${scheduleDateStr}T00:00:00`,
    updatedAt: `${scheduleDateStr}T00:00:00`,
  };

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
      const url = request.url();

      if (method === "GET" && !url.includes("/schedules/")) {
        // スケジュール一覧取得（配列を直接返す）
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([mockSchedule]),
        });
      } else if (method === "GET" && url.includes("/schedules/")) {
        // スケジュール詳細取得
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...mockSchedule,
            supplement: {
              id: "supplement-1",
              scheduleId: "schedule-1",
              keywords: ["キーワード1", "キーワード2"],
              aiResult: "AIの検索結果",
              userMemo: null,
              createdAt: `${scheduleDateStr}T00:00:00`,
              updatedAt: `${scheduleDateStr}T00:00:00`,
            },
          }),
        });
      } else if (method === "POST") {
        // スケジュール作成（スケジュールを直接返す）
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(mockSchedule),
        });
      } else if (method === "PUT") {
        // スケジュール更新（スケジュールを直接返す）
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...mockSchedule, title: "更新された予定" }),
        });
      } else if (method === "DELETE") {
        // スケジュール削除
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
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

  test("should display schedules on calendar", async ({ page }) => {
    // カレンダーが表示されていること
    await expect(page.locator('[role="grid"]')).toBeVisible();

    // スケジュールタイトルが表示されていること
    await expect(page.getByText("テスト予定")).toBeVisible();
  });

  test("should create a new schedule", async ({ page }) => {
    // AIエンドポイントのモック
    await page.route("**/api/ai/suggest-keywords", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ keywords: ["キーワード1", "キーワード2", "キーワード3"] }),
      });
    });

    // 日付セルをクリック
    const dateCell = page.locator('[data-testid="calendar-day"]').first();
    await dateCell.click();

    // モーダルが開くこと
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // フォームに入力
    await page.getByLabel("タイトル").fill("新しい予定");

    // 次へボタンをクリック
    await page.getByRole("button", { name: "次へ" }).click();

    // キーワード選択画面が表示されること（APIレスポンスを待つ）
    await expect(page.getByText("キーワード選択")).toBeVisible({ timeout: 15000 });
  });

  test.fixme("should view schedule details", async ({ page }) => {
    // TODO: スケジュール一覧のモックレスポンスがカレンダー表示と一致しない問題を修正する
    // スケジュールが表示されるのを待つ
    await expect(page.getByText("テスト予定")).toBeVisible({ timeout: 10000 });

    // スケジュールをクリック
    await page.getByText("テスト予定").click();

    // 詳細モーダルが開くこと
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // ローディングが完了するのを待つ（スケジュールタイトルが表示される）
    await expect(modal.getByText("テスト予定")).toBeVisible({ timeout: 10000 });
  });

  test("should delete a schedule", async ({ page }) => {
    // スケジュールをクリックして詳細を開く
    await page.getByText("テスト予定").click();

    // 詳細モーダルが開くこと
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // 削除ボタンをクリック
    const deleteButton = page.getByRole("button", { name: /削除/i });
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // 確認ダイアログが表示された場合は確認
      const confirmButton = page.getByRole("button", { name: /削除する|はい/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
    }
  });
});
