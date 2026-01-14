import {
  type User,
  meResponseSchema,
  updateProfileResponseSchema,
  userSchema,
} from "@ai-scheduler/shared";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { z } from "zod";
import { setApiAccessToken, setTokenRefreshCallback } from "../api";
import type { Storage, SyncStorage } from "../storage";
import type { Logger } from "../utils/logger";

// Cookie版ログインレスポンス（リフレッシュトークンなし、HttpOnly Cookieで設定済み）
const loginResponseSchema = z.object({
  accessToken: z.string(),
  user: userSchema,
});

// Cookie版リフレッシュレスポンス（アクセストークンのみ、リフレッシュトークンはCookieで更新済み）
const refreshResponseSchema = z.object({
  accessToken: z.string(),
});

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (code: string, redirectUri: string) => Promise<void>;
  devLogin: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  updateEmail: (email: string) => Promise<void>;
  reconnectGoogle: (code: string, redirectUri: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// ユーザー情報のキャッシュ用キー
const USER_KEY = "auth_user";

/**
 * AuthProvider の設定
 */
export type AuthProviderConfig = {
  /** API ベース URL */
  apiBaseUrl: string;
  /** ストレージ実装 */
  storage: Storage & SyncStorage;
  /** ロガー */
  logger: Logger;
  /** Cookie を使用するかどうか（Web環境では true） */
  useCredentials?: boolean;
};

export function AuthProvider({
  children,
  config,
}: {
  children: ReactNode;
  config: AuthProviderConfig;
}) {
  const { apiBaseUrl, storage, logger, useCredentials = true } = config;

  const [user, setUser] = useState<User | null>(() => {
    const stored = storage.getSync(USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      // localStorageのデータが破損している場合は削除
      storage.removeSync(USER_KEY);
      return null;
    }
  });
  // アクセストークンはメモリのみで管理（XSS対策）
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
  const isInitializedRef = useRef(false);

  // アクセストークンが変更されたらapi.tsに反映
  useEffect(() => {
    setApiAccessToken(accessToken);
  }, [accessToken]);

  // リフレッシュトークン（HttpOnly Cookie）を使ってアクセストークンを更新
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    // 既にリフレッシュ中の場合は既存のPromiseを返す
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    refreshPromiseRef.current = (async () => {
      try {
        const fetchOptions: RequestInit = {
          method: "POST",
        };
        if (useCredentials) {
          fetchOptions.credentials = "include";
        }

        // リフレッシュトークンはHttpOnly Cookieで自動送信される
        const res = await fetch(`${apiBaseUrl}/auth/refresh`, fetchOptions);

        if (!res.ok) {
          // リフレッシュトークンが無効な場合はログアウト
          await storage.remove(USER_KEY);
          setAccessToken(null);
          setUser(null);
          return null;
        }

        const json: unknown = await res.json();
        const result = refreshResponseSchema.safeParse(json);
        if (!result.success) {
          return null;
        }
        setAccessToken(result.data.accessToken);
        return result.data.accessToken;
      } catch (error) {
        logger.error("Token refresh failed", { category: "auth" }, error);
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [apiBaseUrl, storage, logger, useCredentials]);

  // リフレッシュコールバックをapi.tsに設定
  useEffect(() => {
    setTokenRefreshCallback(refreshAccessToken);
    return () => {
      setTokenRefreshCallback(null);
    };
  }, [refreshAccessToken]);

  // 初回マウント時にリフレッシュトークン（Cookie）でアクセストークンを取得
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally run only on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // React Strict Modeでの二重実行を防止
      if (isInitializedRef.current) {
        return;
      }
      isInitializedRef.current = true;

      try {
        // リフレッシュトークン（Cookie）でアクセストークンを取得
        const newToken = await refreshAccessToken();
        if (newToken) {
          // アクセストークン取得成功、ユーザー情報を取得
          const res = await fetch(`${apiBaseUrl}/auth/me`, {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          });

          if (res.ok) {
            const json: unknown = await res.json();
            const result = meResponseSchema.safeParse(json);
            if (result.success) {
              setUser(result.data.user);
              await storage.set(USER_KEY, JSON.stringify(result.data.user));
            }
          }
        } else {
          // リフレッシュ失敗時はキャッシュされたユーザー情報をクリア
          await storage.remove(USER_KEY);
          setUser(null);
        }
      } catch (error) {
        logger.error("Auth initialization failed", { category: "auth" }, error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []); // 初回のみ実行

  const login = useCallback(
    async (code: string, redirectUri: string) => {
      setIsLoading(true);
      try {
        const fetchOptions: RequestInit = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, redirectUri }),
        };
        if (useCredentials) {
          fetchOptions.credentials = "include";
        }

        const res = await fetch(`${apiBaseUrl}/auth/google`, fetchOptions);

        if (!res.ok) {
          const errorJson: unknown = await res.json();
          const errorMessage =
            typeof errorJson === "object" &&
            errorJson !== null &&
            "message" in errorJson &&
            typeof errorJson.message === "string"
              ? errorJson.message
              : "ログインに失敗しました";
          throw new Error(errorMessage);
        }

        const json: unknown = await res.json();
        const result = loginResponseSchema.safeParse(json);
        if (!result.success) {
          throw new Error("レスポンスの形式が不正です");
        }
        // アクセストークンはメモリのみ、リフレッシュトークンはHttpOnly Cookieで保存済み
        setAccessToken(result.data.accessToken);
        setUser(result.data.user);
        await storage.set(USER_KEY, JSON.stringify(result.data.user));
      } finally {
        setIsLoading(false);
      }
    },
    [apiBaseUrl, storage, useCredentials]
  );

  // 開発環境用ログイン（Google認証をバイパス）
  const devLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchOptions: RequestInit = {
        method: "POST",
      };
      if (useCredentials) {
        fetchOptions.credentials = "include";
      }

      const res = await fetch(`${apiBaseUrl}/auth/dev-login`, fetchOptions);

      if (!res.ok) {
        const errorJson: unknown = await res.json();
        const errorMessage =
          typeof errorJson === "object" &&
          errorJson !== null &&
          "message" in errorJson &&
          typeof errorJson.message === "string"
            ? errorJson.message
            : "開発環境ログインに失敗しました";
        throw new Error(errorMessage);
      }

      const json: unknown = await res.json();
      const result = loginResponseSchema.safeParse(json);
      if (!result.success) {
        throw new Error("レスポンスの形式が不正です");
      }
      setAccessToken(result.data.accessToken);
      setUser(result.data.user);
      await storage.set(USER_KEY, JSON.stringify(result.data.user));
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, storage, useCredentials]);

  const logout = useCallback(async () => {
    try {
      const fetchOptions: RequestInit = {
        method: "POST",
      };
      if (useCredentials) {
        fetchOptions.credentials = "include";
      }

      // サーバーにログアウトを通知（リフレッシュトークンを無効化 + Cookieを削除）
      await fetch(`${apiBaseUrl}/auth/logout`, fetchOptions);
    } catch (error) {
      logger.error("Logout API call failed", { category: "auth" }, error);
    } finally {
      // ローカルの状態をクリア
      await storage.remove(USER_KEY);
      setAccessToken(null);
      setUser(null);
    }
  }, [apiBaseUrl, storage, logger, useCredentials]);

  const updateEmail = useCallback(
    async (email: string) => {
      if (!accessToken) {
        throw new Error("認証が必要です");
      }

      const res = await fetch(`${apiBaseUrl}/auth/email`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errorJson: unknown = await res.json();
        const errorMessage =
          typeof errorJson === "object" &&
          errorJson !== null &&
          "message" in errorJson &&
          typeof errorJson.message === "string"
            ? errorJson.message
            : "メールアドレスの更新に失敗しました";
        throw new Error(errorMessage);
      }

      const json: unknown = await res.json();
      const result = updateProfileResponseSchema.safeParse(json);
      if (!result.success) {
        throw new Error("レスポンスの形式が不正です");
      }
      setUser(result.data.user);
      await storage.set(USER_KEY, JSON.stringify(result.data.user));
    },
    [accessToken, apiBaseUrl, storage]
  );

  const reconnectGoogle = useCallback(
    async (code: string, redirectUri: string) => {
      if (!accessToken) {
        throw new Error("認証が必要です");
      }

      const res = await fetch(`${apiBaseUrl}/auth/reconnect-google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ code, redirectUri }),
      });

      if (!res.ok) {
        const errorJson: unknown = await res.json();
        const errorMessage =
          typeof errorJson === "object" &&
          errorJson !== null &&
          "message" in errorJson &&
          typeof errorJson.message === "string"
            ? errorJson.message
            : "Googleアカウントの再設定に失敗しました";
        throw new Error(errorMessage);
      }

      const json: unknown = await res.json();
      const result = updateProfileResponseSchema.safeParse(json);
      if (!result.success) {
        throw new Error("レスポンスの形式が不正です");
      }
      setUser(result.data.user);
      await storage.set(USER_KEY, JSON.stringify(result.data.user));
    },
    [accessToken, apiBaseUrl, storage]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user && !!accessToken,
        login,
        devLogin,
        logout,
        refreshAccessToken,
        updateEmail,
        reconnectGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
