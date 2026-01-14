import { type AppError, createInternalError } from "../../shared/errors";
import { logger } from "../../shared/logger";
import type { Result } from "../../shared/result";
import type { OAuthProvider, OAuthUserInfo } from "./oauth";

type GoogleTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
};

type GoogleUserInfoResponse = {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  picture?: string;
};

export const createGoogleAuthService = (clientId: string, clientSecret: string): OAuthProvider => ({
  type: "google",

  // 認証コードからアクセストークンを取得
  exchangeCodeForToken: async (
    code: string,
    redirectUri: string
  ): Promise<Result<string, AppError>> => {
    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Google token exchange failed", {
          category: "oauth",
          responseBody: errorText,
        });
        return {
          ok: false,
          error: createInternalError("Googleトークン取得に失敗しました"),
        };
      }

      const data = (await response.json()) as GoogleTokenResponse;
      return { ok: true, value: data.access_token };
    } catch (error) {
      logger.error("Google token exchange error", { category: "oauth" }, error);
      return {
        ok: false,
        error: createInternalError("Googleトークン取得中にエラーが発生しました"),
      };
    }
  },

  // アクセストークンからユーザー情報を取得
  getUserInfo: async (accessToken: string): Promise<Result<OAuthUserInfo, AppError>> => {
    try {
      const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Google user info fetch failed", {
          category: "oauth",
          responseBody: errorText,
        });
        return {
          ok: false,
          error: createInternalError("Googleユーザー情報の取得に失敗しました"),
        };
      }

      const data = (await response.json()) as GoogleUserInfoResponse;

      // 未検証メールアドレスでのログインを拒否
      if (!data.verified_email) {
        return {
          ok: false,
          error: createInternalError("メールアドレスが未検証です"),
        };
      }

      return {
        ok: true,
        value: {
          id: data.id,
          email: data.email,
          name: data.name,
          picture: data.picture,
        },
      };
    } catch (error) {
      logger.error("Google user info error", { category: "oauth" }, error);
      return {
        ok: false,
        error: createInternalError("Googleユーザー情報取得中にエラーが発生しました"),
      };
    }
  },
});

export type GoogleAuthService = ReturnType<typeof createGoogleAuthService>;
