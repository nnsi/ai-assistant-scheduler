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
