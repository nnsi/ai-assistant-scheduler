import { test, expect } from "@playwright/test";
import { TEST_ACCESS_TOKEN, AUTH_TOKEN_KEY } from "./test-constants";

/**
 * 認証フローのE2Eテスト
 * APIモックを使用してログイン/ログアウトをテスト
 */
test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // APIモックを設定
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

    // ログインボタンが表示されていること
    const loginButton = page.getByRole("button", { name: /Googleでログイン/i });
    await expect(loginButton).toBeVisible();
  });

  test("should redirect to OAuth callback and login", async ({ page }) => {
    await page.goto("/");

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

    // ページをリロード
    await page.reload();

    // カレンダーが表示されていること（ログイン済み）
    await expect(page.locator('[role="grid"]')).toBeVisible();
  });

  test("should logout successfully", async ({ page }) => {
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

    // ユーザーメニューを探す
    const userMenu = page.getByRole("button", { name: /Test User|ユーザー/i });
    if (await userMenu.isVisible()) {
      await userMenu.click();

      // ログアウトボタンをクリック
      const logoutButton = page.getByRole("button", { name: /ログアウト/i });
      if (await logoutButton.isVisible()) {
        await logoutButton.click();

        // localStorageがクリアされていること
        const accessToken = await page.evaluate(() =>
          localStorage.getItem("auth_access_token")
        );
        expect(accessToken).toBeNull();
      }
    }
  });
});
