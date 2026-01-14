import { expect, test } from "@playwright/test";
import { cleanupTestData, loginWithDevAuth } from "./test-constants";

/**
 * スケジュール管理の基本操作E2Eテスト
 * 実APIを使用
 */
test.describe("Schedule Management", () => {
  test.beforeEach(async ({ page }) => {
    // テストデータをクリーンアップ
    await cleanupTestData(page);
    // dev-loginでログイン
    await loginWithDevAuth(page);
  });

  test.afterEach(async ({ page }) => {
    // テストデータをクリーンアップ
    await cleanupTestData(page);
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

    // AIで補完ボタンが表示されていること
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
