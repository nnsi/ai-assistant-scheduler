import { test, expect } from "@playwright/test";
import { TEST_ACCESS_TOKEN, AUTH_TOKEN_KEY, setupCalendarMocks } from "./test-constants";

/**
 * 認証フローのE2Eテスト
 * APIモックを使用してログイン/ログアウトをテスト
 */
test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // APIモックを設定（ページ遷移前にルートを設定）
    // 初回は未認証なので401を返す
    await page.route("**/api/auth/refresh", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Unauthorized" }),
      });
    });

    await page.route("**/api/auth/google", async (route) => {
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
          accessToken: "test-access-token",
          refreshToken: "test-refresh-token",
        }),
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

    await page.route("**/api/auth/logout", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
  });

  test("should show login page for unauthenticated users", async ({ page }) => {
    await page.goto("/");

    // TanStack Routerにより未認証ユーザーは/loginにリダイレクトされる
    await expect(page).toHaveURL(/\/login/);

    // ログインボタンが表示されていること
    const loginButton = page.getByRole("button", { name: /Googleでログイン/i });
    await expect(loginButton).toBeVisible();
  });

  test("should redirect to OAuth callback and login", async ({ page }) => {
    await page.goto("/");

    // 認証成功後のモックを設定
    await page.unroute("**/api/auth/refresh");
    await page.route("**/api/auth/refresh", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ accessToken: TEST_ACCESS_TOKEN }),
      });
    });

    // localStorageに認証情報を設定（ログイン後の状態をシミュレート）
    await page.evaluate(
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

    // スケジュール一覧のモック（配列を直接返す）
    await page.route("**/api/schedules*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
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

    // ページをリロード
    await page.reload();

    // カレンダーが表示されていること（ログイン済み）
    await expect(page.locator('[role="grid"]')).toBeVisible();
  });

  test("should logout successfully", async ({ page }) => {
    // 認証成功後のモックを設定
    await page.unroute("**/api/auth/refresh");
    await page.route("**/api/auth/refresh", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ accessToken: TEST_ACCESS_TOKEN }),
      });
    });

    // スケジュール一覧のモック（配列を直接返す）
    await page.route("**/api/schedules*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
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

    // ログイン状態を設定
    await page.goto("/");
    await page.evaluate(
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
    await page.reload();

    // ユーザーメニューをクリック（Test Userの名前またはイニシャルを含むボタン）
    const userMenu = page.getByRole("button", { name: /Test User|T/i }).first();
    await expect(userMenu).toBeVisible({ timeout: 10000 });
    await userMenu.click();

    // プロフィール設定モーダルが開くこと
    await expect(page.getByRole("dialog")).toBeVisible();

    // ログアウトボタンをクリック
    const logoutButton = page.getByRole("button", { name: /ログアウト/i });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // localStorageのauth_userがクリアされていること（アプリはauth_userを管理する）
    await expect(async () => {
      const authUser = await page.evaluate(() =>
        localStorage.getItem("auth_user")
      );
      expect(authUser).toBeNull();
    }).toPass({ timeout: 5000 });
  });
});
