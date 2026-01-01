import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import {
  authResponseSchema,
  tokenResponseSchema,
  meResponseSchema,
  updateProfileResponseSchema,
  type User,
} from "@ai-scheduler/shared";

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (code: string, redirectUri: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
  updateEmail: (email: string) => Promise<void>;
  reconnectGoogle: (code: string, redirectUri: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const USER_KEY = "auth_user";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  });
  const [isLoading, setIsLoading] = useState(true);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  // リフレッシュトークンを使ってアクセストークンを更新
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    // 既にリフレッシュ中の場合は既存のPromiseを返す
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return null;
    }

    refreshPromiseRef.current = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
          // リフレッシュトークンが無効な場合はログアウト
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setAccessToken(null);
          setUser(null);
          return null;
        }

        const json: unknown = await res.json();
        const result = tokenResponseSchema.safeParse(json);
        if (!result.success) {
          return null;
        }
        setAccessToken(result.data.accessToken);
        localStorage.setItem(ACCESS_TOKEN_KEY, result.data.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, result.data.refreshToken);
        return result.data.accessToken;
      } catch (error) {
        console.error("Token refresh failed:", error);
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, []);

  // 初回マウント時にトークンを検証
  useEffect(() => {
    const verifyToken = async () => {
      if (!accessToken) {
        // アクセストークンがない場合、リフレッシュを試みる
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            setIsLoading(false);
            return;
          }
        }
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (res.ok) {
          const json: unknown = await res.json();
          const result = meResponseSchema.safeParse(json);
          if (result.success) {
            setUser(result.data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(result.data.user));
          }
        } else if (res.status === 401) {
          // アクセストークンが期限切れの場合、リフレッシュを試みる
          const newToken = await refreshAccessToken();
          if (newToken) {
            // リフレッシュ成功、再度ユーザー情報を取得
            const retryRes = await fetch(`${API_BASE_URL}/auth/me`, {
              headers: {
                Authorization: `Bearer ${newToken}`,
              },
            });
            if (retryRes.ok) {
              const retryJson: unknown = await retryRes.json();
              const retryResult = meResponseSchema.safeParse(retryJson);
              if (retryResult.success) {
                setUser(retryResult.data.user);
                localStorage.setItem(USER_KEY, JSON.stringify(retryResult.data.user));
              }
            }
          }
        }
      } catch (error) {
        console.error("Token verification failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []); // 初回のみ実行

  const login = useCallback(async (code: string, redirectUri: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
            : "ログインに失敗しました";
        throw new Error(errorMessage);
      }

      const json: unknown = await res.json();
      const result = authResponseSchema.safeParse(json);
      if (!result.success) {
        throw new Error("レスポンスの形式が不正です");
      }
      setAccessToken(result.data.accessToken);
      setUser(result.data.user);
      localStorage.setItem(ACCESS_TOKEN_KEY, result.data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, result.data.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(result.data.user));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAccessToken(null);
    setUser(null);
  }, []);

  const updateEmail = useCallback(async (email: string) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      throw new Error("認証が必要です");
    }

    const res = await fetch(`${API_BASE_URL}/auth/email`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
    localStorage.setItem(USER_KEY, JSON.stringify(result.data.user));
  }, []);

  const reconnectGoogle = useCallback(async (code: string, redirectUri: string) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      throw new Error("認証が必要です");
    }

    const res = await fetch(`${API_BASE_URL}/auth/reconnect-google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
    localStorage.setItem(USER_KEY, JSON.stringify(result.data.user));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user && !!accessToken,
        login,
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
