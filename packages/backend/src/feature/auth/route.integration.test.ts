import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  googleAuthCallbackSchema,
  refreshTokenSchema,
  logoutSchema,
} from "@ai-scheduler/shared";
import {
  createTestDb,
  createTestUser,
  resetDatabase,
  type TestDb,
} from "../../test/helpers";
import { createUserRepo } from "../../infra/drizzle/userRepo";
import { createRefreshTokenRepo } from "../../infra/drizzle/refreshTokenRepo";
import { createCalendarRepo } from "../../infra/drizzle/calendarRepo";
import { createJwtService } from "../../infra/auth/jwt";
import { createOAuthAuthUseCase } from "./usecase/oauthAuth";
import { createGetCurrentUserUseCase } from "./usecase/getCurrentUser";
import { createRefreshTokenUseCase } from "./usecase/refreshToken";
import { createLogoutUseCase } from "./usecase/logout";
import { createValidationError, createUnauthorizedError } from "../../shared/errors";
import { getStatusCode } from "../../shared/http";
import type { OAuthProvider } from "../../infra/auth/oauth";

// モック用のOAuthProvider
const createMockOAuthProvider = (): OAuthProvider => ({
  type: "google",
  exchangeCodeForToken: vi.fn().mockResolvedValue({
    ok: true,
    value: "mock-access-token",
  }),
  getUserInfo: vi.fn().mockResolvedValue({
    ok: true,
    value: {
      id: "google-mock-123",
      email: "mock@example.com",
      name: "Mock User",
      picture: "https://example.com/mock.jpg",
    },
  }),
});

// テスト用のAuthアプリを作成
const createTestAuthApp = (
  db: TestDb,
  oauthProvider: OAuthProvider
) => {
  const app = new Hono();
  const userRepo = createUserRepo(db as any);
  const refreshTokenRepo = createRefreshTokenRepo(db as any);
  const calendarRepo = createCalendarRepo(db as any);
  const jwtService = createJwtService("test-jwt-secret");

  const googleAuth = createOAuthAuthUseCase(
    userRepo,
    refreshTokenRepo,
    calendarRepo,
    oauthProvider,
    jwtService
  );
  const getCurrentUser = createGetCurrentUserUseCase(userRepo);
  const refreshToken = createRefreshTokenUseCase(userRepo, refreshTokenRepo, jwtService);
  const logout = createLogoutUseCase(refreshTokenRepo, jwtService);

  // POST /auth/google
  app.post(
    "/auth/google",
    zValidator("json", googleAuthCallbackSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const { code, redirectUri } = c.req.valid("json");
      const result = await googleAuth(code, redirectUri);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json(result.value, 200);
    }
  );

  // GET /auth/me
  app.get("/auth/me", async (c) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json(createUnauthorizedError(), 401);
    }

    const token = authHeader.substring(7);
    const payload = await jwtService.verifyAccessToken(token);

    if (!payload) {
      return c.json(createUnauthorizedError("無効なトークンです"), 401);
    }

    const result = await getCurrentUser(payload.sub);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json({ user: result.value }, 200);
  });

  // POST /auth/refresh
  app.post(
    "/auth/refresh",
    zValidator("json", refreshTokenSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const { refreshToken: token } = c.req.valid("json");
      const result = await refreshToken(token);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json(result.value, 200);
    }
  );

  // POST /auth/logout
  app.post(
    "/auth/logout",
    zValidator("json", logoutSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const { refreshToken: token } = c.req.valid("json");
      const result = await logout(token);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json(result.value, 200);
    }
  );

  return { app, jwtService };
};

describe("Auth API Integration Tests", () => {
  let db: TestDb;
  let mockOAuthProvider: OAuthProvider;
  let app: Hono;
  let jwtService: ReturnType<typeof createJwtService>;

  beforeAll(() => {
    db = createTestDb();
    mockOAuthProvider = createMockOAuthProvider();
    const testApp = createTestAuthApp(db, mockOAuthProvider);
    app = testApp.app;
    jwtService = testApp.jwtService;
  });

  beforeEach(async () => {
    await resetDatabase(db);
    vi.clearAllMocks();

    // モックをリセット
    vi.mocked(mockOAuthProvider.exchangeCodeForToken).mockResolvedValue({
      ok: true,
      value: "mock-access-token",
    });
    vi.mocked(mockOAuthProvider.getUserInfo).mockResolvedValue({
      ok: true,
      value: {
        id: "google-mock-123",
        email: "mock@example.com",
        name: "Mock User",
        picture: "https://example.com/mock.jpg",
      },
    });
  });

  describe("POST /auth/google", () => {
    it("should create new user and return tokens", async () => {
      const res = await app.request("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "valid-auth-code",
          redirectUri: "http://localhost:5173/auth/callback",
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        user: { id: string; email: string; name: string };
        accessToken: string;
        refreshToken: string;
      };
      expect(data.accessToken).toBeDefined();
      expect(data.refreshToken).toBeDefined();
      expect(data.user.email).toBe("mock@example.com");
      expect(data.user.name).toBe("Mock User");
    });

    it("should return existing user when logging in again", async () => {
      // 最初のログイン
      await app.request("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "valid-auth-code",
          redirectUri: "http://localhost:5173/auth/callback",
        }),
      });

      // 2回目のログイン
      const res = await app.request("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "valid-auth-code",
          redirectUri: "http://localhost:5173/auth/callback",
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        user: { id: string; email: string };
        accessToken: string;
        refreshToken: string;
      };
      expect(data.user.email).toBe("mock@example.com");
    });

    it("should return 400 for missing code", async () => {
      const res = await app.request("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          redirectUri: "http://localhost:5173/auth/callback",
        }),
      });

      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid redirectUri", async () => {
      const res = await app.request("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "valid-auth-code",
          redirectUri: "not-a-valid-url",
        }),
      });

      expect(res.status).toBe(400);
    });

    it("should return error when Google token exchange fails", async () => {
      vi.mocked(mockOAuthProvider.exchangeCodeForToken).mockResolvedValue({
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "Token exchange failed" },
      });

      const res = await app.request("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "invalid-code",
          redirectUri: "http://localhost:5173/auth/callback",
        }),
      });

      expect(res.status).toBe(500);
    });
  });

  describe("GET /auth/me", () => {
    it("should return current user with valid access token", async () => {
      // まずログインしてトークンを取得
      const loginRes = await app.request("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "valid-auth-code",
          redirectUri: "http://localhost:5173/auth/callback",
        }),
      });
      const loginData = (await loginRes.json()) as { accessToken: string };

      // アクセストークンを使って/auth/meにアクセス
      const res = await app.request("/auth/me", {
        headers: {
          Authorization: `Bearer ${loginData.accessToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        user: { id: string; email: string; name: string };
      };
      expect(data.user.email).toBe("mock@example.com");
      expect(data.user.name).toBe("Mock User");
    });

    it("should return 401 when using refresh token instead of access token", async () => {
      // ログインしてリフレッシュトークンを取得
      const loginRes = await app.request("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "valid-auth-code",
          redirectUri: "http://localhost:5173/auth/callback",
        }),
      });
      const loginData = (await loginRes.json()) as { refreshToken: string };

      // リフレッシュトークンを使って/auth/meにアクセス（失敗するはず）
      const res = await app.request("/auth/me", {
        headers: {
          Authorization: `Bearer ${loginData.refreshToken}`,
        },
      });

      expect(res.status).toBe(401);
    });

    it("should return 401 without Authorization header", async () => {
      const res = await app.request("/auth/me");

      expect(res.status).toBe(401);
      const data = (await res.json()) as { code: string };
      expect(data.code).toBe("UNAUTHORIZED");
    });

    it("should return 401 with invalid token", async () => {
      const res = await app.request("/auth/me", {
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should return 401 with malformed Authorization header", async () => {
      const res = await app.request("/auth/me", {
        headers: {
          Authorization: "InvalidFormat token",
        },
      });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /auth/refresh", () => {
    it("should return new tokens with valid refresh token", async () => {
      // ログインしてリフレッシュトークンを取得
      const loginRes = await app.request("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "valid-auth-code",
          redirectUri: "http://localhost:5173/auth/callback",
        }),
      });
      const loginData = (await loginRes.json()) as { refreshToken: string };

      // リフレッシュトークンを使って新しいトークンを取得
      const res = await app.request("/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken: loginData.refreshToken,
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        accessToken: string;
        refreshToken: string;
      };
      expect(data.accessToken).toBeDefined();
      expect(data.refreshToken).toBeDefined();
    });

    it("should return 401 with invalid refresh token", async () => {
      const res = await app.request("/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken: "invalid-refresh-token",
        }),
      });

      expect(res.status).toBe(401);
    });

    it("should return 401 when using access token instead of refresh token", async () => {
      // ログインしてアクセストークンを取得
      const loginRes = await app.request("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "valid-auth-code",
          redirectUri: "http://localhost:5173/auth/callback",
        }),
      });
      const loginData = (await loginRes.json()) as { accessToken: string };

      // アクセストークンをリフレッシュに使う（失敗するはず）
      const res = await app.request("/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken: loginData.accessToken,
        }),
      });

      expect(res.status).toBe(401);
    });

    it("should return 400 for missing refresh token", async () => {
      const res = await app.request("/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /auth/logout", () => {
    it("should return success and invalidate all refresh tokens", async () => {
      // まずログインしてトークンを取得
      const loginRes = await app.request("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "valid-auth-code",
          redirectUri: "http://localhost:5173/auth/callback",
        }),
      });
      const loginData = (await loginRes.json()) as { refreshToken: string };

      // ログアウト
      const res = await app.request("/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken: loginData.refreshToken,
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as { success: boolean };
      expect(data.success).toBe(true);

      // ログアウト後、同じリフレッシュトークンは使えなくなるはず
      const refreshRes = await app.request("/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken: loginData.refreshToken,
        }),
      });
      expect(refreshRes.status).toBe(401);
    });

    it("should return 401 for invalid refresh token", async () => {
      const res = await app.request("/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshToken: "invalid-token",
        }),
      });

      expect(res.status).toBe(401);
    });

    it("should return 400 for missing refresh token", async () => {
      const res = await app.request("/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });
});
