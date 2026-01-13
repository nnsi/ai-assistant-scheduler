/**
 * Google認証フック（React Native用）
 */
import { useEffect, useCallback } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { config } from "./config";

// WebBrowser セッションを登録（認証フロー完了時に自動でアプリに戻る）
WebBrowser.maybeCompleteAuthSession();

/**
 * Google認証フック
 * 認証コードを取得し、バックエンドでトークン交換を行う
 */
export function useGoogleAuth(onSuccess: (code: string, redirectUri: string) => Promise<void>) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: config.googleIosClientId,
    androidClientId: config.googleAndroidClientId,
    webClientId: config.googleWebClientId,
    responseType: "code",
    scopes: ["profile", "email"],
  });

  // 認証レスポンスを処理
  useEffect(() => {
    if (response?.type === "success" && response.params.code) {
      const { code } = response.params;
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: "ai-scheduler",
      });
      onSuccess(code, redirectUri).catch((error) => {
        console.error("[GoogleAuth] Login failed:", error);
      });
    }
  }, [response, onSuccess]);

  const signIn = useCallback(async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error("[GoogleAuth] Prompt failed:", error);
    }
  }, [promptAsync]);

  return {
    signIn,
    isReady: !!request,
    isLoading: response?.type === "success" && !response.params.code,
  };
}

/**
 * リダイレクトURIを取得
 */
export function getRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: "ai-scheduler",
  });
}
