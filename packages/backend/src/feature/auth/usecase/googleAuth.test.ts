import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGoogleAuthUseCase } from "./googleAuth";
import type { UserRepo } from "../../../domain/infra/userRepo";
import type { GoogleAuthService } from "../../../infra/auth/google";
import type { JwtService } from "../../../infra/auth/jwt";
import type { UserEntity } from "../../../domain/model/user";

describe("googleAuthUseCase", () => {
  const mockUser: UserEntity = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    picture: "https://example.com/photo.jpg",
    googleId: "google-123",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };

  const createMockUserRepo = (): UserRepo => ({
    findById: vi.fn(),
    findByGoogleId: vi.fn(),
    findByEmail: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  });

  const createMockGoogleAuthService = (): GoogleAuthService => ({
    exchangeCodeForToken: vi.fn(),
    getUserInfo: vi.fn(),
  });

  const createMockJwtService = (): JwtService => ({
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
    generateTokens: vi.fn(),
    verifyToken: vi.fn(),
    verifyAccessToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create new user and return tokens when user does not exist", async () => {
    const userRepo = createMockUserRepo();
    const googleAuthService = createMockGoogleAuthService();
    const jwtService = createMockJwtService();

    vi.mocked(googleAuthService.exchangeCodeForToken).mockResolvedValue({
      ok: true,
      value: "access-token",
    });
    vi.mocked(googleAuthService.getUserInfo).mockResolvedValue({
      ok: true,
      value: {
        id: "google-new",
        email: "new@example.com",
        name: "New User",
        picture: "https://example.com/new.jpg",
      },
    });
    vi.mocked(userRepo.findByGoogleId).mockResolvedValue(null);
    vi.mocked(jwtService.generateTokens).mockResolvedValue({
      accessToken: "jwt-access-token",
      refreshToken: "jwt-refresh-token",
    });

    const googleAuth = createGoogleAuthUseCase(
      userRepo,
      googleAuthService,
      jwtService
    );
    const result = await googleAuth("auth-code", "http://localhost/callback");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accessToken).toBe("jwt-access-token");
      expect(result.value.refreshToken).toBe("jwt-refresh-token");
      expect(result.value.user.email).toBe("new@example.com");
      expect(result.value.user.name).toBe("New User");
    }
    expect(userRepo.save).toHaveBeenCalled();
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it("should update existing user and return tokens", async () => {
    const userRepo = createMockUserRepo();
    const googleAuthService = createMockGoogleAuthService();
    const jwtService = createMockJwtService();

    vi.mocked(googleAuthService.exchangeCodeForToken).mockResolvedValue({
      ok: true,
      value: "access-token",
    });
    vi.mocked(googleAuthService.getUserInfo).mockResolvedValue({
      ok: true,
      value: {
        id: "google-123",
        email: "test@example.com",
        name: "Updated Name",
        picture: "https://example.com/updated.jpg",
      },
    });
    vi.mocked(userRepo.findByGoogleId).mockResolvedValue(mockUser);
    vi.mocked(jwtService.generateTokens).mockResolvedValue({
      accessToken: "jwt-access-token",
      refreshToken: "jwt-refresh-token",
    });

    const googleAuth = createGoogleAuthUseCase(
      userRepo,
      googleAuthService,
      jwtService
    );
    const result = await googleAuth("auth-code", "http://localhost/callback");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accessToken).toBe("jwt-access-token");
      expect(result.value.refreshToken).toBe("jwt-refresh-token");
      expect(result.value.user.name).toBe("Updated Name");
    }
    expect(userRepo.save).not.toHaveBeenCalled();
    expect(userRepo.update).toHaveBeenCalled();
  });

  it("should return error when token exchange fails", async () => {
    const userRepo = createMockUserRepo();
    const googleAuthService = createMockGoogleAuthService();
    const jwtService = createMockJwtService();

    vi.mocked(googleAuthService.exchangeCodeForToken).mockResolvedValue({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Token exchange failed" },
    });

    const googleAuth = createGoogleAuthUseCase(
      userRepo,
      googleAuthService,
      jwtService
    );
    const result = await googleAuth("invalid-code", "http://localhost/callback");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INTERNAL_ERROR");
    }
  });

  it("should return error when getUserInfo fails", async () => {
    const userRepo = createMockUserRepo();
    const googleAuthService = createMockGoogleAuthService();
    const jwtService = createMockJwtService();

    vi.mocked(googleAuthService.exchangeCodeForToken).mockResolvedValue({
      ok: true,
      value: "access-token",
    });
    vi.mocked(googleAuthService.getUserInfo).mockResolvedValue({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to get user info" },
    });

    const googleAuth = createGoogleAuthUseCase(
      userRepo,
      googleAuthService,
      jwtService
    );
    const result = await googleAuth("auth-code", "http://localhost/callback");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INTERNAL_ERROR");
    }
  });
});
