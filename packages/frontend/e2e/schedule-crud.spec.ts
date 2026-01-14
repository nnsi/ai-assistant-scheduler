import { expect, test } from "@playwright/test";
import { cleanupTestData, loginWithDevAuth } from "./test-constants";

/**
 * スケジュールCRUD操作のE2Eテスト
 * 実APIを使用
 */
test.describe("Schedule CRUD Operations", () => {
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

  test("should create a new schedule", async ({ page }) => {
    // 日付セルをクリック
    const dateCell = page.locator('[data-testid="calendar-day"]').first();
    await dateCell.click();

    // モーダルが開くこと
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // フォームに入力
    await page.getByLabel("タイトル").fill("E2Eテスト予定");

    // AIで補完ボタンをクリック
    await page.getByRole("button", { name: "AIで補完" }).click();

    // キーワード選択画面が表示されること（APIレスポンスを待つ）
    await expect(page.getByText("キーワード選択")).toBeVisible({ timeout: 30000 });

    // キーワードを選択してスケジュールを作成
    // 最初のキーワードを選択
    const keywordCheckbox = page.locator('input[type="checkbox"]').first();
    if (await keywordCheckbox.isVisible()) {
      await keywordCheckbox.check();
    }

    // 保存ボタンをクリック
    const saveButton = page.getByRole("button", { name: /保存|作成/i });
    if (await saveButton.isVisible()) {
      await saveButton.click();
    }
  });

  test("should create schedule with end time", async ({ page }) => {
    // 日付セルをクリック
    const dateCell = page.locator('[data-testid="calendar-day"]').first();
    await dateCell.click();

    // モーダルが開くこと
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // タイトルを入力
    await page.getByLabel("タイトル").fill("終了時間テスト");

    // 「+終了時間を追加」ボタンをクリック
    await page.getByRole("button", { name: "+ 終了時間を追加" }).click();

    // 終了時間フィールドが表示されること
    await expect(page.getByLabel("終了日")).toBeVisible();
    await expect(page.getByLabel("終了時間")).toBeVisible();

    // ラベルが「開始日」「開始時間」に変更されていること
    await expect(page.getByText("開始日")).toBeVisible();
    await expect(page.getByText("開始時間")).toBeVisible();

    // 終了時間を設定
    await page.getByLabel("終了時間").fill("14:00");

    // 「終了時間を削除」ボタンが表示されること
    await expect(page.getByRole("button", { name: "終了時間を削除" })).toBeVisible();
  });

  test("should toggle end time field visibility", async ({ page }) => {
    // 日付セルをクリック
    const dateCell = page.locator('[data-testid="calendar-day"]').first();
    await dateCell.click();

    // モーダルが開くこと
    await expect(page.getByRole("dialog")).toBeVisible();

    // 初期状態では終了時間フィールドは非表示
    await expect(page.getByLabel("終了時間")).not.toBeVisible();

    // 「+終了時間を追加」ボタンをクリック
    await page.getByRole("button", { name: "+ 終了時間を追加" }).click();

    // 終了時間フィールドが表示される
    await expect(page.getByLabel("終了時間")).toBeVisible();

    // 「終了時間を削除」ボタンをクリック
    await page.getByRole("button", { name: "終了時間を削除" }).click();

    // 終了時間フィールドが非表示に戻る
    await expect(page.getByLabel("終了時間")).not.toBeVisible();
    await expect(page.getByRole("button", { name: "+ 終了時間を追加" })).toBeVisible();
  });
});

/**
 * スケジュール表示・編集・削除のE2Eテスト
 * 事前にスケジュールを作成してからテストを実行
 */
test.describe("Schedule View/Edit/Delete", () => {
  test.beforeEach(async ({ page, context }) => {
    // ブラウザのクッキーとストレージをクリア
    await context.clearCookies();

    // データベースを完全にリセット
    await page.request.post("http://127.0.0.1:8788/api/e2e/reset");

    // 先にブラウザでログイン（ユーザーを作成）
    await loginWithDevAuth(page);

    // ユーザーのカレンダーを取得
    const calendarsResponse = await page.request.get("http://127.0.0.1:8788/api/calendars", {
      headers: { "X-Dev-Auth": "true" },
    });
    const calendars = await calendarsResponse.json();
    const calendarId = calendars[0]?.id;

    // テスト用スケジュールをAPI経由で作成
    const today = new Date();
    const scheduleDate = new Date(today.getFullYear(), today.getMonth(), 15);
    const scheduleDateStr = `${scheduleDate.getFullYear()}-${String(scheduleDate.getMonth() + 1).padStart(2, "0")}-15`;

    const response = await page.request.post("http://127.0.0.1:8788/api/schedules", {
      headers: {
        "X-Dev-Auth": "true",
        "Content-Type": "application/json",
      },
      data: {
        title: "テスト予定",
        startAt: `${scheduleDateStr}T10:00:00+09:00`,
        endAt: `${scheduleDateStr}T11:00:00+09:00`,
        isAllDay: false,
        calendarId: calendarId, // ユーザーのカレンダーに紐付け
      },
    });

    // APIレスポンスを確認（デバッグ用）
    if (!response.ok()) {
      console.error("Schedule creation failed:", await response.text());
    }

    // スケジュールを再取得するため、月を移動してから戻る
    // これでReact Queryが新しいデータを取得する
    await page.getByRole("button", { name: "次へ" }).click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "前へ" }).click();
    await page.waitForLoadState("networkidle");
  });

  test.afterEach(async ({ page }) => {
    // テストデータをクリーンアップ
    await cleanupTestData(page);
  });

  test("should display schedule on calendar", async ({ page }) => {
    // カレンダーが表示されていること
    await expect(page.locator('[role="grid"]')).toBeVisible();

    // スケジュールタイトルが表示されていること
    await expect(page.getByText("テスト予定")).toBeVisible({ timeout: 10000 });
  });

  test("should view schedule details", async ({ page }) => {
    // スケジュールが表示されるのを待つ
    await expect(page.getByText("テスト予定")).toBeVisible({ timeout: 10000 });

    // スケジュールをクリック
    await page.getByText("テスト予定").click();

    // 詳細モーダルが開くこと
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // スケジュールタイトルが表示される
    await expect(modal.getByText("テスト予定")).toBeVisible({ timeout: 10000 });
  });

  test("should delete a schedule", async ({ page }) => {
    // スケジュールをクリックして詳細を開く
    await expect(page.getByText("テスト予定")).toBeVisible({ timeout: 10000 });
    await page.getByText("テスト予定").click();

    // 詳細モーダルが開くこと
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // 削除ボタンをクリック
    const deleteButton = page.getByRole("button", { name: /削除/i });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // 確認ダイアログが表示された場合は確認
    const confirmButton = page.getByRole("button", { name: /削除する|はい/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // モーダルが閉じる
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });

  test("should display end time in day view", async ({ page }) => {
    // 日表示に切り替え
    await page.getByRole("button", { name: "日表示" }).click();

    // 15日まで移動
    const targetDay = 15;
    const today = new Date();
    const currentDay = today.getDate();
    const daysToMove = targetDay - currentDay;

    for (let i = 0; i < Math.abs(daysToMove); i++) {
      if (daysToMove > 0) {
        await page.getByRole("button", { name: "次へ" }).click();
      } else {
        await page.getByRole("button", { name: "前へ" }).click();
      }
    }

    // スケジュールが「10:00 - 11:00」形式で表示されること
    await expect(page.getByRole("button", { name: /10:00 - 11:00.*テスト予定/ })).toBeVisible({
      timeout: 10000,
    });
  });
});

/**
 * カテゴリ付きスケジュール編集のE2Eテスト
 */
test.describe("Schedule Edit with Category", () => {
  test.beforeEach(async ({ page }) => {
    // 先にログインしてユーザーを作成
    await loginWithDevAuth(page);

    // テストデータをクリーンアップ
    await cleanupTestData(page);

    // カテゴリを作成
    await page.request.post("http://127.0.0.1:8788/api/categories", {
      headers: {
        "X-Dev-Auth": "true",
        "Content-Type": "application/json",
      },
      data: {
        name: "仕事",
        color: "#3B82F6",
      },
    });

    await page.request.post("http://127.0.0.1:8788/api/categories", {
      headers: {
        "X-Dev-Auth": "true",
        "Content-Type": "application/json",
      },
      data: {
        name: "プライベート",
        color: "#10B981",
      },
    });

    // ページをリロードしてカテゴリを反映
    await page.reload();
  });

  test.afterEach(async ({ page }) => {
    // テストデータをクリーンアップ
    await cleanupTestData(page);

    // カテゴリもクリーンアップ
    const response = await page.request.get("http://127.0.0.1:8788/api/categories", {
      headers: {
        "X-Dev-Auth": "true",
      },
    });

    if (response.ok()) {
      const categories = await response.json();
      for (const category of categories) {
        await page.request.delete(`http://127.0.0.1:8788/api/categories/${category.id}`, {
          headers: {
            "X-Dev-Auth": "true",
          },
        });
      }
    }
  });

  test("should display category selection in schedule form", async ({ page }) => {
    // 日付セルをクリック
    const dateCell = page.locator('[data-testid="calendar-day"]').first();
    await dateCell.click();

    // モーダルが開くこと
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // カテゴリ選択が表示されること
    await expect(page.getByRole("button", { name: "なし" })).toBeVisible();
    await expect(page.getByRole("button", { name: "仕事" })).toBeVisible();
    await expect(page.getByRole("button", { name: "プライベート" })).toBeVisible();
  });

  test("should select category when creating schedule", async ({ page }) => {
    // 日付セルをクリック
    const dateCell = page.locator('[data-testid="calendar-day"]').first();
    await dateCell.click();

    // モーダルが開くこと
    await expect(page.getByRole("dialog")).toBeVisible();

    // タイトルを入力
    await page.getByLabel("タイトル").fill("カテゴリ付き予定");

    // 「仕事」カテゴリを選択
    const workCategoryButton = page.getByRole("button", { name: "仕事" });
    await workCategoryButton.click();

    // 選択状態になること
    await expect(workCategoryButton).toHaveAttribute("aria-pressed", "true");
  });
});
