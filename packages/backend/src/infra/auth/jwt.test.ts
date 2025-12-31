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

  describe("generateToken", () => {
    it("should generate a valid JWT token", async () => {
      const jwtService = createJwtService(secret);
      const token = await jwtService.generateToken(testUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // Header.Payload.Signature
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token and return payload", async () => {
      const jwtService = createJwtService(secret);
      const token = await jwtService.generateToken(testUser);
      const payload = await jwtService.verifyToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe("user-123");
      expect(payload?.email).toBe("test@example.com");
    });

    it("should return null for invalid token", async () => {
      const jwtService = createJwtService(secret);
      const payload = await jwtService.verifyToken("invalid-token");

      expect(payload).toBeNull();
    });

    it("should return null for token signed with different secret", async () => {
      const jwtService1 = createJwtService("secret1");
      const jwtService2 = createJwtService("secret2");

      const token = await jwtService1.generateToken(testUser);
      const payload = await jwtService2.verifyToken(token);

      expect(payload).toBeNull();
    });

    it("should return payload with expiration time", async () => {
      const jwtService = createJwtService(secret);
      const token = await jwtService.generateToken(testUser);
      const payload = await jwtService.verifyToken(token);

      expect(payload?.exp).toBeDefined();
      expect(typeof payload?.exp).toBe("number");
      // expは現在時刻より未来であるべき
      expect(payload!.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });
});
