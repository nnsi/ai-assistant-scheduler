import { test, expect } from "@playwright/test";
import { loginWithDevAuth } from "./test-constants";

/**
 * 認証フローのE2Eテスト
 * 実APIを使用してログイン/ログアウトをテスト
 */
test.describe("Authentication Flow", () => {
  test("should show login page for unauthenticated users", async ({ page }) => {
    await page.goto("/");

    // TanStack Routerにより未認証ユーザーは/loginにリダイレクトされる
    await expect(page).toHaveURL(/\/login/);

    // ログインボタンが表示されていること
    const loginButton = page.getByRole("button", { name: /Googleでログイン/i });
    await expect(loginButton).toBeVisible();
  });

  test("should login with dev auth and show calendar", async ({ page }) => {
    // dev-loginでログイン
    await loginWithDevAuth(page);

    // カレンダーが表示されていること（ログイン済み）
    await expect(page.locator('[role="grid"]')).toBeVisible();
  });

  test("should logout successfully", async ({ page }) => {
    // dev-loginでログイン
    await loginWithDevAuth(page);

    // カレンダーが表示されるのを待つ
    await expect(page.locator('[role="grid"]')).toBeVisible();

    // ユーザーメニューをクリック（開発テストユーザーの名前またはイニシャルを含むボタン）
    const userMenu = page.getByRole("button", { name: /開発テストユーザー|開/i }).first();
    await expect(userMenu).toBeVisible({ timeout: 10000 });
    await userMenu.click();

    // プロフィール設定モーダルが開くこと
    await expect(page.getByRole("dialog")).toBeVisible();

    // ログアウトボタンをクリック
    const logoutButton = page.getByRole("button", { name: /ログアウト/i });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // ログインページにリダイレクトされること
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
