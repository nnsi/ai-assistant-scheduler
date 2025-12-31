import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { googleAuthCallbackSchema } from "@ai-scheduler/shared";
import {
  createTestDb,
  createTestUser,
  resetDatabase,
  type TestDb,
} from "../../test/helpers";
import { createUserRepo } from "../../infra/drizzle/userRepo";
import { createJwtService } from "../../infra/auth/jwt";
import { createGoogleAuthUseCase } from "./usecase/googleAuth";
import { createGetCurrentUserUseCase } from "./usecase/getCurrentUser";
import { createValidationError, createUnauthorizedError } from "../../shared/errors";
import { getStatusCode } from "../../shared/http";
import type { GoogleAuthService } from "../../infra/auth/google";

// モック用のGoogleAuthService
const createMockGoogleAuthService = (): GoogleAuthService => ({
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
  googleAuthService: GoogleAuthService
) => {
  const app = new Hono();
  const userRepo = createUserRepo(db as any);
  const jwtService = createJwtService("test-jwt-secret");

  const googleAuth = createGoogleAuthUseCase(
    userRepo,
    googleAuthService,
    jwtService
  );
  const getCurrentUser = createGetCurrentUserUseCase(userRepo);

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
    const payload = await jwtService.verifyToken(token);

    if (!payload) {
      return c.json(createUnauthorizedError("無効なトークンです"), 401);
    }

    const result = await getCurrentUser(payload.sub);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json({ user: result.value }, 200);
  });

  // POST /auth/logout
  app.post("/auth/logout", async (c) => {
    return c.json({ success: true }, 200);
  });

  return { app, jwtService };
};

describe("Auth API Integration Tests", () => {
  let db: TestDb;
  let mockGoogleAuthService: GoogleAuthService;
  let app: Hono;
  let jwtService: ReturnType<typeof createJwtService>;

  beforeAll(() => {
    db = createTestDb();
    mockGoogleAuthService = createMockGoogleAuthService();
    const testApp = createTestAuthApp(db, mockGoogleAuthService);
    app = testApp.app;
    jwtService = testApp.jwtService;
  });

  beforeEach(async () => {
    await resetDatabase(db);
    vi.clearAllMocks();

    // モックをリセット
    vi.mocked(mockGoogleAuthService.exchangeCodeForToken).mockResolvedValue({
      ok: true,
      value: "mock-access-token",
    });
    vi.mocked(mockGoogleAuthService.getUserInfo).mockResolvedValue({
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
    it("should create new user and return token", async () => {
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
        token: string;
      };
      expect(data.token).toBeDefined();
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
        token: string;
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
      vi.mocked(mockGoogleAuthService.exchangeCodeForToken).mockResolvedValue({
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
    it("should return current user with valid token", async () => {
      // まずログインしてトークンを取得
      const loginRes = await app.request("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "valid-auth-code",
          redirectUri: "http://localhost:5173/auth/callback",
        }),
      });
      const loginData = (await loginRes.json()) as { token: string };

      // トークンを使って/auth/meにアクセス
      const res = await app.request("/auth/me", {
        headers: {
          Authorization: `Bearer ${loginData.token}`,
        },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        user: { id: string; email: string; name: string };
      };
      expect(data.user.email).toBe("mock@example.com");
      expect(data.user.name).toBe("Mock User");
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

  describe("POST /auth/logout", () => {
    it("should return success", async () => {
      const res = await app.request("/auth/logout", {
        method: "POST",
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as { success: boolean };
      expect(data.success).toBe(true);
    });
  });
});
