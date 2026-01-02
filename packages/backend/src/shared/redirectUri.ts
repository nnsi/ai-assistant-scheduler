import { createInvalidRedirectUriError } from "./errors";
import type { Result } from "./result";

/**
 * 許可されたリダイレクトURIのパターン
 * 本番環境では環境変数から読み込むことを推奨
 */
const ALLOWED_REDIRECT_URI_PATTERNS = [
  // 開発環境
  /^http:\/\/localhost:\d+\/?.*$/,
  /^http:\/\/127\.0\.0\.1:\d+\/?.*$/,
  // Cloudflare Pages（本番）
  /^https:\/\/[\w-]+\.pages\.dev\/?.*$/,
  // カスタムドメイン（本番で設定）
  // 具体的なドメインは ALLOWED_REDIRECT_URIS 環境変数で追加
];

/**
 * リダイレクトURIが許可されているかを検証
 *
 * @param redirectUri - 検証するリダイレクトURI
 * @param allowedUris - 追加で許可するURIリスト（環境変数から）
 * @returns 検証結果
 */
export const validateRedirectUri = (
  redirectUri: string,
  allowedUris?: string
): Result<true> => {
  // 追加の許可URIがあれば、完全一致でチェック
  if (allowedUris) {
    const uriList = allowedUris.split(",").map((uri) => uri.trim());
    if (uriList.includes(redirectUri)) {
      return { ok: true, value: true };
    }
  }

  // パターンマッチでチェック
  const isAllowed = ALLOWED_REDIRECT_URI_PATTERNS.some((pattern) =>
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

/**
 * URIのオリジン部分を抽出
 * 例: "http://localhost:5173/callback" -> "http://localhost:5173"
 */
export const extractOrigin = (uri: string): string | null => {
  try {
    const url = new URL(uri);
    return url.origin;
  } catch {
    return null;
  }
};
