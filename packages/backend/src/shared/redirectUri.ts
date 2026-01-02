import { createInvalidRedirectUriError } from "./errors";
import type { Result } from "./result";

/**
 * 開発環境用のリダイレクトURIパターン
 * 本番環境では ALLOWED_REDIRECT_URIS 環境変数を使用し、このパターンは無視される
 */
const DEV_ALLOWED_REDIRECT_URI_PATTERNS = [
  // 開発環境のみ - localhostへのリダイレクト
  /^http:\/\/localhost:\d+\/callback$/,
  /^http:\/\/127\.0\.0\.1:\d+\/callback$/,
];

/**
 * リダイレクトURIが許可されているかを検証
 *
 * セキュリティ: ALLOWED_REDIRECT_URIS が設定されている場合、完全一致のみ許可
 * 設定されていない場合は開発環境用パターンにフォールバック
 *
 * @param redirectUri - 検証するリダイレクトURI
 * @param allowedUris - 許可するURIリスト（環境変数から、カンマ区切り）
 * @returns 検証結果
 */
export const validateRedirectUri = (
  redirectUri: string,
  allowedUris?: string
): Result<true> => {
  // ALLOWED_REDIRECT_URIS が設定されている場合、完全一致のみ許可
  // これにより本番環境では明示的に許可されたURIのみ受け付ける
  if (allowedUris) {
    const uriList = allowedUris.split(",").map((uri) => uri.trim());
    if (uriList.includes(redirectUri)) {
      return { ok: true, value: true };
    }
    // 設定されているが一致しない場合はエラー（パターンマッチにフォールバックしない）
    return {
      ok: false,
      error: createInvalidRedirectUriError(
        `リダイレクトURI "${redirectUri}" は許可されていません`
      ),
    };
  }

  // ALLOWED_REDIRECT_URIS が未設定の場合、開発環境用パターンでチェック
  // 本番環境では必ず ALLOWED_REDIRECT_URIS を設定すること
  const isAllowed = DEV_ALLOWED_REDIRECT_URI_PATTERNS.some((pattern) =>
    pattern.test(redirectUri)
  );

  if (!isAllowed) {
    return {
      ok: false,
      error: createInvalidRedirectUriError(
        `リダイレクトURI "${redirectUri}" は許可されていません`
      ),
    };
  }

  return { ok: true, value: true };
};

