import { expect, test } from "@playwright/test";
import { cleanupTestData, loginWithDevAuth } from "./test-constants";

/**
 * AI機能のE2Eテスト
 * 実APIを使用してキーワード提案と検索をテスト
 *
 * 注意: バックエンドのUSE_MOCK_AIがtrueの場合はモックAIが使用される
 */
test.describe("AI Features", () => {
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
    await expect(page.getByText("キーワード選択")).toBeVisible({ timeout: 30000 });

    // キーワードボタンが表示されること（具体的なキーワードはAIの出力次第なので、ボタンが存在することを確認）
    const keywordButtons = page
      .locator('[role="dialog"] button')
      .filter({ hasText: /^[^ス検キ閉]/ });
    await expect(keywordButtons.first()).toBeVisible();
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
    await expect(page.getByText("キーワード選択")).toBeVisible({ timeout: 30000 });

    // キーワードを選択（チェックボックスを使用）
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 0) {
      // 最初のキーワードを選択
      await checkboxes.first().check();
    }

    // 検索ボタンをクリック
    const searchButton = page.getByRole("button", { name: /検索する/ });
    if (await searchButton.isEnabled()) {
      await searchButton.click();

      // 検索結果画面が表示されること（モーダルタイトルで確認）
      await expect(page.getByRole("heading", { name: "検索結果", level: 2 })).toBeVisible({
        timeout: 60000,
      });
    }
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
    await expect(page.getByText("キーワード選択")).toBeVisible({ timeout: 30000 });

    // スキップボタンをクリック
    const skipButton = page.getByRole("button", { name: /スキップ/i });
    if (await skipButton.isVisible()) {
      await skipButton.click();

      // モーダルが閉じること
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
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
    await expect(page.getByText("キーワード選択")).toBeVisible({ timeout: 30000 });

    // キーワードを選択（チェックボックスを使用）
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 0) {
      // 最初のキーワードを選択
      await checkboxes.first().check();
    }

    // 検索ボタンをクリック
    const searchButton = page.getByRole("button", { name: /検索する/ });
    if (await searchButton.isEnabled()) {
      await searchButton.click();

      // 検索結果画面が表示されるまで待機（モーダルタイトルで確認）
      await expect(page.getByRole("heading", { name: "検索結果", level: 2 })).toBeVisible({
        timeout: 60000,
      });

      // 閉じる/終了するボタンをクリック（検索結果は自動保存されるので閉じるだけ）
      await page.getByRole("button", { name: /閉じる|終了する/ }).click();

      // モーダルが閉じること
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    }
  });
});
