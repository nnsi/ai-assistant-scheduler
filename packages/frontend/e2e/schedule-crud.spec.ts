import { test, expect } from "@playwright/test";
import { TEST_ACCESS_TOKEN, AUTH_TOKEN_KEY, setupCalendarMocks } from "./test-constants";

/**
 * スケジュールCRUD操作のE2Eテスト
 * APIモックを使用
 */
test.describe("Schedule CRUD Operations", () => {
  // 現在の月の15日を使用（カレンダーに表示されるように）
  const today = new Date();
  const scheduleDate = new Date(today.getFullYear(), today.getMonth(), 15);
  const scheduleDateStr = `${scheduleDate.getFullYear()}-${String(scheduleDate.getMonth() + 1).padStart(2, "0")}-15`;

  // scheduleSchemaに合わせる
  const mockSchedule = {
    id: "schedule-1",
    title: "テスト予定",
    startAt: `${scheduleDateStr}T10:00:00+09:00`,
    endAt: `${scheduleDateStr}T11:00:00+09:00`,
    isAllDay: false,
    createdAt: `${scheduleDateStr}T00:00:00+09:00`,
    updatedAt: `${scheduleDateStr}T00:00:00+09:00`,
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

    // スケジュール詳細取得のモック（先に設定することで優先度を高く）
    await page.route("**/api/schedules/*", async (route, request) => {
      const method = request.method();
      if (method === "GET") {
        // スケジュール詳細取得（scheduleWithSupplementSchemaに合わせる）
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...mockSchedule,
            supplement: {
              id: "supplement-1",
              keywords: ["キーワード1", "キーワード2"],
              aiResult: "AIの検索結果",
              shopCandidates: null,
              selectedShops: null,
              userMemo: null,
            },
          }),
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

    // スケジュール一覧・作成のモック
    await page.route("**/api/schedules?*", async (route, request) => {
      const method = request.method();
      if (method === "GET") {
        // スケジュール一覧取得（配列を直接返す）
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([mockSchedule]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/schedules", async (route, request) => {
      const method = request.method();
      if (method === "POST") {
        // スケジュール作成（スケジュールを直接返す）
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(mockSchedule),
        });
      } else if (method === "GET") {
        // クエリパラメータなしのGET（一覧取得）
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([mockSchedule]),
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

    // カレンダーとカテゴリのモックを設定
    await setupCalendarMocks(page);

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
        body: JSON.stringify({ keywords: ["キーワード1", "キーワード2", "キーワード3"], agentTypes: ["search"] }),
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

    // AIで補完ボタンをクリック
    await page.getByRole("button", { name: "AIで補完" }).click();

    // キーワード選択画面が表示されること（APIレスポンスを待つ）
    await expect(page.getByText("キーワード選択")).toBeVisible({ timeout: 15000 });
  });

  test("should view schedule details", async ({ page }) => {
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

  test("should display end time in day view", async ({ page }) => {
    // 日表示に切り替え
    await page.getByRole("button", { name: "日表示" }).click();

    // mockScheduleの日付（15日）まで移動
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

    // スケジュールが「10:00 - 11:00」形式で表示されること（mockScheduleのendAtは11:00）
    await expect(page.getByRole("button", { name: /10:00 - 11:00.*テスト予定/ })).toBeVisible();
  });

  test("should load end time in edit form", async ({ page }) => {
    // スケジュールをクリック
    await page.getByText("テスト予定").click();

    // 詳細モーダルが開くこと
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // 編集ボタンをクリック
    await modal.getByRole("button", { name: "編集" }).last().click();

    // 編集モーダルが開くこと
    await expect(page.getByRole("dialog", { name: "予定を編集" })).toBeVisible();

    // 終了時間が読み込まれていること（mockScheduleのendAtは11:00）
    await expect(page.getByLabel("終了時間")).toHaveValue("11:00");
  });
});

/**
 * カテゴリ付きスケジュール編集のE2Eテスト
 * 編集モーダルを開いた時にカテゴリが正しく選択されていることを検証
 */
test.describe("Schedule Edit with Category", () => {
  const today = new Date();
  const scheduleDate = new Date(today.getFullYear(), today.getMonth(), 15);
  const scheduleDateStr = `${scheduleDate.getFullYear()}-${String(scheduleDate.getMonth() + 1).padStart(2, "0")}-15`;

  // カテゴリ付きスケジュールのモック
  const mockScheduleWithCategory = {
    id: "schedule-with-category",
    title: "カテゴリ付き予定",
    startAt: `${scheduleDateStr}T14:00:00+09:00`,
    endAt: `${scheduleDateStr}T15:00:00+09:00`,
    isAllDay: false,
    categoryId: "category-1", // 「仕事」カテゴリ
    category: {
      id: "category-1",
      name: "仕事",
      color: "#3B82F6",
      createdAt: `${scheduleDateStr}T00:00:00+09:00`,
      updatedAt: `${scheduleDateStr}T00:00:00+09:00`,
    },
    createdAt: `${scheduleDateStr}T00:00:00+09:00`,
    updatedAt: `${scheduleDateStr}T00:00:00+09:00`,
  };

  const mockCategories = [
    {
      id: "category-1",
      name: "仕事",
      color: "#3B82F6",
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
    {
      id: "category-2",
      name: "プライベート",
      color: "#10B981",
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
  ];

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

    // 認証APIモック
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

    // スケジュール詳細取得のモック（カテゴリ付き）
    await page.route("**/api/schedules/*", async (route, request) => {
      const method = request.method();
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...mockScheduleWithCategory,
            supplement: {
              id: "supplement-1",
              keywords: [],
              aiResult: null,
              shopCandidates: null,
              selectedShops: null,
              userMemo: null,
            },
          }),
        });
      } else if (method === "PUT") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockScheduleWithCategory),
        });
      } else {
        await route.continue();
      }
    });

    // スケジュール一覧のモック
    await page.route("**/api/schedules?*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([mockScheduleWithCategory]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/schedules", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([mockScheduleWithCategory]),
        });
      } else {
        await route.continue();
      }
    });

    // カテゴリAPIモック
    await page.route("**/api/categories", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockCategories),
      });
    });

    // カレンダーAPIモック
    await page.route("**/api/calendars", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "default-calendar-id",
            name: "マイカレンダー",
            color: "#3B82F6",
            role: "owner",
            memberCount: 1,
            owner: { id: "test-user-id", name: "Test User", picture: null },
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
          },
        ]),
      });
    });

    // 繰り返しルールAPIモック
    await page.route("**/api/recurrence/*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(null),
      });
    });

    await page.route("**/api/profile/conditions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          profile: {
            dietaryRestrictions: [],
            foodAllergies: [],
            cuisinePreferences: [],
            budgetRange: null,
            transportModes: [],
          },
        }),
      });
    });

    await page.goto("/");
  });

  test("should have category selected when editing a schedule with category", async ({ page }) => {
    // スケジュールが表示されるのを待つ
    await expect(page.getByText("カテゴリ付き予定")).toBeVisible({ timeout: 10000 });

    // スケジュールをクリックして詳細を開く
    await page.getByText("カテゴリ付き予定").click();

    // 詳細モーダルが開くこと
    const detailModal = page.getByRole("dialog");
    await expect(detailModal).toBeVisible();

    // ローディングが完了するのを待つ
    await expect(detailModal.getByText("カテゴリ付き予定")).toBeVisible({ timeout: 10000 });

    // 編集ボタンをクリック
    await detailModal.getByRole("button", { name: "編集" }).last().click();

    // 編集モーダルが開くこと
    const editModal = page.getByRole("dialog", { name: "予定を編集" });
    await expect(editModal).toBeVisible();

    // カテゴリボタンが表示されるのを待つ
    await expect(editModal.getByRole("button", { name: "仕事" })).toBeVisible({ timeout: 5000 });

    // 「仕事」カテゴリが選択状態（aria-pressed="true"）であること
    const workCategoryButton = editModal.getByRole("button", { name: "仕事" });
    await expect(workCategoryButton).toHaveAttribute("aria-pressed", "true");

    // 「プライベート」カテゴリは非選択状態であること
    const privateCategoryButton = editModal.getByRole("button", { name: "プライベート" });
    await expect(privateCategoryButton).toHaveAttribute("aria-pressed", "false");

    // 「なし」ボタンは非選択状態であること
    const noCategoryButton = editModal.getByRole("button", { name: "なし" });
    await expect(noCategoryButton).toHaveAttribute("aria-pressed", "false");
  });

  test("should have no category selected when editing a schedule without category", async ({ page }) => {
    // カテゴリなしスケジュールのモックを上書き
    const mockScheduleWithoutCategory = {
      id: "schedule-without-category",
      title: "カテゴリなし予定",
      startAt: `${scheduleDateStr}T14:00:00+09:00`,
      endAt: null,
      isAllDay: false,
      categoryId: null,
      category: null,
      createdAt: `${scheduleDateStr}T00:00:00+09:00`,
      updatedAt: `${scheduleDateStr}T00:00:00+09:00`,
    };

    // モックを上書き
    await page.route("**/api/schedules/*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...mockScheduleWithoutCategory,
            supplement: {
              id: "supplement-1",
              keywords: [],
              aiResult: null,
              shopCandidates: null,
              selectedShops: null,
              userMemo: null,
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/schedules?*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([mockScheduleWithoutCategory]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/schedules", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([mockScheduleWithoutCategory]),
        });
      } else {
        await route.continue();
      }
    });

    // ページをリロードしてモックを適用
    await page.reload();

    // スケジュールが表示されるのを待つ
    await expect(page.getByText("カテゴリなし予定")).toBeVisible({ timeout: 10000 });

    // スケジュールをクリックして詳細を開く
    await page.getByText("カテゴリなし予定").click();

    // 詳細モーダルが開くこと
    const detailModal = page.getByRole("dialog");
    await expect(detailModal).toBeVisible();

    // ローディングが完了するのを待つ
    await expect(detailModal.getByText("カテゴリなし予定")).toBeVisible({ timeout: 10000 });

    // 編集ボタンをクリック
    await detailModal.getByRole("button", { name: "編集" }).last().click();

    // 編集モーダルが開くこと
    const editModal = page.getByRole("dialog", { name: "予定を編集" });
    await expect(editModal).toBeVisible();

    // カテゴリボタンが表示されるのを待つ
    await expect(editModal.getByRole("button", { name: "なし" })).toBeVisible({ timeout: 5000 });

    // 「なし」ボタンが選択状態であること
    const noCategoryButton = editModal.getByRole("button", { name: "なし" });
    await expect(noCategoryButton).toHaveAttribute("aria-pressed", "true");

    // 他のカテゴリは非選択状態であること
    const workCategoryButton = editModal.getByRole("button", { name: "仕事" });
    await expect(workCategoryButton).toHaveAttribute("aria-pressed", "false");
  });

  test("should correctly update category selection when switching between schedules", async ({ page }) => {
    // 2つのスケジュール（カテゴリなし→カテゴリあり）を切り替えて編集する
    // このテストは、ScheduleFormがリマウントされない場合に発生するバグを検出する

    const mockScheduleWithoutCategory = {
      id: "schedule-without-category",
      title: "カテゴリなし予定",
      startAt: `${scheduleDateStr}T10:00:00+09:00`,
      endAt: null,
      isAllDay: false,
      categoryId: null,
      category: null,
      createdAt: `${scheduleDateStr}T00:00:00+09:00`,
      updatedAt: `${scheduleDateStr}T00:00:00+09:00`,
    };

    // 両方のスケジュールを返すようにモックを設定
    await page.route("**/api/schedules?*", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([mockScheduleWithoutCategory, mockScheduleWithCategory]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/schedules", async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([mockScheduleWithoutCategory, mockScheduleWithCategory]),
        });
      } else {
        await route.continue();
      }
    });

    // スケジュール詳細のモックを動的に設定
    await page.route("**/api/schedules/*", async (route, request) => {
      const url = request.url();
      const method = request.method();

      if (method === "GET") {
        // URLからスケジュールIDを取得
        const scheduleId = url.split("/schedules/")[1]?.split("?")[0];

        const schedule = scheduleId === "schedule-without-category"
          ? mockScheduleWithoutCategory
          : mockScheduleWithCategory;

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...schedule,
            supplement: {
              id: "supplement-1",
              keywords: [],
              aiResult: null,
              shopCandidates: null,
              selectedShops: null,
              userMemo: null,
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // ページをリロードしてモックを適用
    await page.reload();

    // 両方のスケジュールが表示されるのを待つ
    await expect(page.getByText("カテゴリなし予定")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("カテゴリ付き予定")).toBeVisible({ timeout: 10000 });

    // Step 1: カテゴリなし予定の編集モーダルを開く
    await page.getByText("カテゴリなし予定").click();
    const detailModal = page.getByRole("dialog");
    await expect(detailModal).toBeVisible();
    await expect(detailModal.getByText("カテゴリなし予定")).toBeVisible({ timeout: 10000 });
    await detailModal.getByRole("button", { name: "編集" }).last().click();

    // 編集モーダルで「なし」が選択されていることを確認
    const editModal = page.getByRole("dialog", { name: "予定を編集" });
    await expect(editModal).toBeVisible();
    await expect(editModal.getByRole("button", { name: "なし" })).toHaveAttribute("aria-pressed", "true");

    // キャンセルして閉じる（編集モーダルだけ閉じて、詳細モーダルは開いたまま）
    await editModal.getByRole("button", { name: "キャンセル" }).click();
    await expect(editModal).not.toBeVisible();

    // 詳細モーダルを閉じる
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Step 2: カテゴリ付き予定の編集モーダルを開く
    await page.getByText("カテゴリ付き予定").click();
    const detailModal2 = page.getByRole("dialog");
    await expect(detailModal2).toBeVisible();
    await expect(detailModal2.getByText("カテゴリ付き予定")).toBeVisible({ timeout: 10000 });
    await detailModal2.getByRole("button", { name: "編集" }).last().click();

    // 編集モーダルで「仕事」カテゴリが選択されていることを確認
    // バグがある場合、ここで「なし」が選択されたままになる
    const editModal2 = page.getByRole("dialog", { name: "予定を編集" });
    await expect(editModal2).toBeVisible();

    // カテゴリボタンが表示されるのを待つ
    await expect(editModal2.getByRole("button", { name: "仕事" })).toBeVisible({ timeout: 5000 });

    // 「仕事」カテゴリが選択されていること（バグがあるとこれが失敗する）
    await expect(editModal2.getByRole("button", { name: "仕事" })).toHaveAttribute("aria-pressed", "true");

    // 「なし」は選択されていないこと
    await expect(editModal2.getByRole("button", { name: "なし" })).toHaveAttribute("aria-pressed", "false");
  });
});
