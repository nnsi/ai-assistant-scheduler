/**
 * E2Eテスト用のヘルパー関数
 * 実APIを叩く形式のE2Eテスト用
 */

import type { Page } from "@playwright/test";

/**
 * dev-loginを使って認証済み状態を作成
 * @param page Playwrightのページオブジェクト
 */
export const loginWithDevAuth = async (page: Page): Promise<void> => {
  await page.goto("/login");

  // 開発環境ログインボタンをクリック
  const devLoginButton = page.getByRole("button", { name: /開発環境ログイン/i });
  await devLoginButton.click();

  // ログイン完了を待つ（カレンダーページにリダイレクトされる）
  await page.waitForURL(/^(?!.*\/login).*$/, { timeout: 10000 });
};

/**
 * dev-userを作成（API経由でdev-loginを叩く）
 * beforeEachでスケジュール作成前に呼び出す
 * @param page Playwrightのページオブジェクト
 */
export const ensureDevUserExists = async (page: Page): Promise<void> => {
  await page.request.post("http://127.0.0.1:8788/api/auth/dev-login");
};

/**
 * テストデータをクリーンアップ
 * テスト終了時にスケジュールを削除する
 * @param page Playwrightのページオブジェクト
 */
export const cleanupTestData = async (page: Page): Promise<void> => {
  // スケジュール一覧を取得して全て削除
  const response = await page.request.get("http://127.0.0.1:8788/api/schedules", {
    headers: {
      "X-Dev-Auth": "true",
    },
  });

  if (response.ok()) {
    const schedules = await response.json();
    for (const schedule of schedules) {
      await page.request.delete(`http://127.0.0.1:8788/api/schedules/${schedule.id}`, {
        headers: {
          "X-Dev-Auth": "true",
        },
      });
    }
  }
};
