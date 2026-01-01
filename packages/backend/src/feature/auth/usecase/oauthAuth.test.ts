import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOAuthAuthUseCase } from "./oauthAuth";
import type { UserRepo } from "../../../domain/infra/userRepo";
import type { RefreshTokenRepo } from "../../../domain/infra/refreshTokenRepo";
import type { OAuthProvider } from "../../../infra/auth/oauth";
import type { JwtService } from "../../../infra/auth/jwt";
import type { UserEntity } from "../../../domain/model/user";

describe("oauthAuthUseCase", () => {
  const mockUser: UserEntity = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    picture: "https://example.com/photo.jpg",
    provider: "google",
    providerId: "google-123",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };

  const createMockUserRepo = (): UserRepo => ({
    findById: vi.fn(),
    findByProviderId: vi.fn(),
    findByEmail: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  });

  const createMockRefreshTokenRepo = (): RefreshTokenRepo => ({
    findById: vi.fn(),
    save: vi.fn(),
    revoke: vi.fn(),
    revokeAllByUserId: vi.fn(),
  });

  const createMockOAuthProvider = (): OAuthProvider => ({
    type: "google",
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
    const refreshTokenRepo = createMockRefreshTokenRepo();
    const oauthProvider = createMockOAuthProvider();
    const jwtService = createMockJwtService();

    vi.mocked(oauthProvider.exchangeCodeForToken).mockResolvedValue({
      ok: true,
      value: "access-token",
    });
    vi.mocked(oauthProvider.getUserInfo).mockResolvedValue({
      ok: true,
      value: {
        id: "google-new",
        email: "new@example.com",
        name: "New User",
        picture: "https://example.com/new.jpg",
      },
    });
    vi.mocked(userRepo.findByProviderId).mockResolvedValue(null);
    vi.mocked(jwtService.generateTokens).mockResolvedValue({
      accessToken: "jwt-access-token",
      refreshToken: "jwt-refresh-token",
    });

    const oauthAuth = createOAuthAuthUseCase(
      userRepo,
      refreshTokenRepo,
      oauthProvider,
      jwtService
    );
    const result = await oauthAuth("auth-code", "http://localhost/callback");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accessToken).toBe("jwt-access-token");
      expect(result.value.refreshToken).toBe("jwt-refresh-token");
      expect(result.value.user.email).toBe("new@example.com");
      expect(result.value.user.name).toBe("New User");
    }
    expect(userRepo.save).toHaveBeenCalled();
    expect(userRepo.update).not.toHaveBeenCalled();
    expect(refreshTokenRepo.save).toHaveBeenCalled();
  });

  it("should update existing user and return tokens", async () => {
    const userRepo = createMockUserRepo();
    const refreshTokenRepo = createMockRefreshTokenRepo();
    const oauthProvider = createMockOAuthProvider();
    const jwtService = createMockJwtService();

    vi.mocked(oauthProvider.exchangeCodeForToken).mockResolvedValue({
      ok: true,
      value: "access-token",
    });
    vi.mocked(oauthProvider.getUserInfo).mockResolvedValue({
      ok: true,
      value: {
        id: "google-123",
        email: "test@example.com",
        name: "Updated Name",
        picture: "https://example.com/updated.jpg",
      },
    });
    vi.mocked(userRepo.findByProviderId).mockResolvedValue(mockUser);
    vi.mocked(jwtService.generateTokens).mockResolvedValue({
      accessToken: "jwt-access-token",
      refreshToken: "jwt-refresh-token",
    });

    const oauthAuth = createOAuthAuthUseCase(
      userRepo,
      refreshTokenRepo,
      oauthProvider,
      jwtService
    );
    const result = await oauthAuth("auth-code", "http://localhost/callback");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accessToken).toBe("jwt-access-token");
      expect(result.value.refreshToken).toBe("jwt-refresh-token");
      expect(result.value.user.name).toBe("Updated Name");
    }
    expect(userRepo.save).not.toHaveBeenCalled();
    expect(userRepo.update).toHaveBeenCalled();
    expect(refreshTokenRepo.save).toHaveBeenCalled();
  });

  it("should return error when token exchange fails", async () => {
    const userRepo = createMockUserRepo();
    const refreshTokenRepo = createMockRefreshTokenRepo();
    const oauthProvider = createMockOAuthProvider();
    const jwtService = createMockJwtService();

    vi.mocked(oauthProvider.exchangeCodeForToken).mockResolvedValue({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Token exchange failed" },
    });

    const oauthAuth = createOAuthAuthUseCase(
      userRepo,
      refreshTokenRepo,
      oauthProvider,
      jwtService
    );
    const result = await oauthAuth("invalid-code", "http://localhost/callback");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INTERNAL_ERROR");
    }
  });

  it("should return error when getUserInfo fails", async () => {
    const userRepo = createMockUserRepo();
    const refreshTokenRepo = createMockRefreshTokenRepo();
    const oauthProvider = createMockOAuthProvider();
    const jwtService = createMockJwtService();

    vi.mocked(oauthProvider.exchangeCodeForToken).mockResolvedValue({
      ok: true,
      value: "access-token",
    });
    vi.mocked(oauthProvider.getUserInfo).mockResolvedValue({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to get user info" },
    });

    const oauthAuth = createOAuthAuthUseCase(
      userRepo,
      refreshTokenRepo,
      oauthProvider,
      jwtService
    );
    const result = await oauthAuth("auth-code", "http://localhost/callback");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INTERNAL_ERROR");
    }
  });
});
