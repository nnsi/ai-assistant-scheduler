import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createJwtService } from "./jwt";
import type { UserEntity } from "../../domain/model/user";

describe("JwtService", () => {
  const testUser: UserEntity = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    picture: "https://example.com/photo.jpg",
    googleId: "google-123",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };

  const secret = "test-secret-key";

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("generateAccessToken", () => {
    it("should generate a valid JWT access token", async () => {
      const jwtService = createJwtService(secret);
      const token = await jwtService.generateAccessToken(testUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a valid JWT refresh token", async () => {
      const jwtService = createJwtService(secret);
      const token = await jwtService.generateRefreshToken(testUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });
  });

  describe("generateTokens", () => {
    it("should generate both access and refresh tokens", async () => {
      const jwtService = createJwtService(secret);
      const tokens = await jwtService.generateTokens(testUser);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify a valid access token and return payload", async () => {
      const jwtService = createJwtService(secret);
      const token = await jwtService.generateAccessToken(testUser);
      const payload = await jwtService.verifyAccessToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe("user-123");
      expect(payload?.email).toBe("test@example.com");
      expect(payload?.type).toBe("access");
    });

    it("should return null for refresh token", async () => {
      const jwtService = createJwtService(secret);
      const refreshToken = await jwtService.generateRefreshToken(testUser);
      const payload = await jwtService.verifyAccessToken(refreshToken);

      expect(payload).toBeNull();
    });

    it("should return null for invalid token", async () => {
      const jwtService = createJwtService(secret);
      const payload = await jwtService.verifyAccessToken("invalid-token");

      expect(payload).toBeNull();
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify a valid refresh token and return payload", async () => {
      const jwtService = createJwtService(secret);
      const token = await jwtService.generateRefreshToken(testUser);
      const payload = await jwtService.verifyRefreshToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe("user-123");
      expect(payload?.type).toBe("refresh");
    });

    it("should return null for access token", async () => {
      const jwtService = createJwtService(secret);
      const accessToken = await jwtService.generateAccessToken(testUser);
      const payload = await jwtService.verifyRefreshToken(accessToken);

      expect(payload).toBeNull();
    });
  });

  describe("verifyToken", () => {
    it("should verify any valid token", async () => {
      const jwtService = createJwtService(secret);
      const accessToken = await jwtService.generateAccessToken(testUser);
      const refreshToken = await jwtService.generateRefreshToken(testUser);

      const accessPayload = await jwtService.verifyToken(accessToken);
      const refreshPayload = await jwtService.verifyToken(refreshToken);

      expect(accessPayload).not.toBeNull();
      expect(refreshPayload).not.toBeNull();
    });

    it("should return null for token signed with different secret", async () => {
      const jwtService1 = createJwtService("secret1");
      const jwtService2 = createJwtService("secret2");

      const token = await jwtService1.generateAccessToken(testUser);
      const payload = await jwtService2.verifyToken(token);

      expect(payload).toBeNull();
    });

    it("should return payload with expiration time", async () => {
      const jwtService = createJwtService(secret);
      const token = await jwtService.generateAccessToken(testUser);
      const payload = await jwtService.verifyToken(token);

      expect(payload?.exp).toBeDefined();
      expect(typeof payload?.exp).toBe("number");
      expect(payload!.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });
});
