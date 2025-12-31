import { test, expect } from "@playwright/test";

test.describe("Schedule Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display calendar with current month", async ({ page }) => {
    // カレンダーヘッダーが表示されていること
    await expect(page.locator("header")).toContainText("AI Assistant Scheduler");

    // カレンダーが表示されていること
    const calendar = page.locator('[role="grid"]');
    await expect(calendar).toBeVisible();

    // 曜日ヘッダーが表示されていること
    await expect(page.getByText("日")).toBeVisible();
    await expect(page.getByText("月")).toBeVisible();
    await expect(page.getByText("火")).toBeVisible();
    await expect(page.getByText("水")).toBeVisible();
    await expect(page.getByText("木")).toBeVisible();
    await expect(page.getByText("金")).toBeVisible();
    await expect(page.getByText("土")).toBeVisible();
  });

  test("should navigate between months", async ({ page }) => {
    // 現在の月を取得
    const monthDisplay = page.locator("h2");
    const initialMonth = await monthDisplay.textContent();

    // 次の月へ移動
    await page.getByRole("button", { name: "次の月" }).click();
    await expect(monthDisplay).not.toHaveText(initialMonth || "");

    // 前の月へ移動
    await page.getByRole("button", { name: "前の月" }).click();
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

    // 次へボタンが表示されていること（APIモックが必要なため、この段階ではフォーム入力まで確認）
    const submitButton = page.getByRole("button", { name: "次へ" });
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
    // 次の月へ移動
    await page.getByRole("button", { name: "次の月" }).click();
    await page.getByRole("button", { name: "次の月" }).click();

    // 今日ボタンをクリック
    await page.getByRole("button", { name: "今日" }).click();

    // 現在の月に戻ること（今日の日付が含まれる月が表示される）
    const today = new Date();
    const expectedMonth = `${today.getFullYear()}年${today.getMonth() + 1}月`;
    await expect(page.locator("h2")).toContainText(expectedMonth);
  });
});
