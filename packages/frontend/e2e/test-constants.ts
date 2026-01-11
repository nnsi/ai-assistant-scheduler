/**
 * E2Eテスト用の定数
 */

/** テスト用アクセストークン */
export const TEST_ACCESS_TOKEN = "test-access-token";

/** テスト用リフレッシュトークン */
export const TEST_REFRESH_TOKEN = "test-refresh-token";

/** ローカルストレージのキー */
export const AUTH_TOKEN_KEY = "auth_access_token";
export const REFRESH_TOKEN_KEY = "auth_refresh_token";

/** テスト用のモックデータ */
export const mockCalendars = [
  {
    id: "default-calendar-id",
    name: "マイカレンダー",
    color: "#3B82F6",
    role: "owner",
    memberCount: 1,
    owner: {
      id: "test-user-id",
      name: "Test User",
      picture: null,
    },
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
];

export const mockCategories = [
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

/**
 * テスト用の認証状態をセットアップ
 * @param page Playwrightのページオブジェクト
 */
export const setupAuthenticatedState = async (
  page: import("@playwright/test").Page
): Promise<void> => {
  await page.evaluate(
    ({ tokenKey, token }) => {
      localStorage.setItem(tokenKey, token);
    },
    { tokenKey: AUTH_TOKEN_KEY, token: TEST_ACCESS_TOKEN }
  );
};

/**
 * カレンダーとカテゴリのAPIモックをセットアップ
 * @param page Playwrightのページオブジェクト
 */
export const setupCalendarMocks = async (
  page: import("@playwright/test").Page
): Promise<void> => {
  await page.route("**/api/calendars", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockCalendars),
    });
  });

  await page.route("**/api/categories", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockCategories),
    });
  });
};
