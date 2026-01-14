import { describe, expect, it, vi } from "vitest";
import type { UserRepo } from "../../../domain/infra/userRepo";
import type { UserEntity } from "../../../domain/model/user";
import { createGetCurrentUserUseCase } from "./getCurrentUser";

describe("getCurrentUserUseCase", () => {
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

  it("should return user when found", async () => {
    const userRepo = createMockUserRepo();
    vi.mocked(userRepo.findById).mockResolvedValue(mockUser);

    const getCurrentUser = createGetCurrentUserUseCase(userRepo);
    const result = await getCurrentUser("user-123");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe("user-123");
      expect(result.value.email).toBe("test@example.com");
      expect(result.value.name).toBe("Test User");
      expect(result.value.picture).toBe("https://example.com/photo.jpg");
    }
    expect(userRepo.findById).toHaveBeenCalledWith("user-123");
  });

  it("should return NOT_FOUND error when user does not exist", async () => {
    const userRepo = createMockUserRepo();
    vi.mocked(userRepo.findById).mockResolvedValue(null);

    const getCurrentUser = createGetCurrentUserUseCase(userRepo);
    const result = await getCurrentUser("non-existent");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("should not include sensitive fields like providerId in response", async () => {
    const userRepo = createMockUserRepo();
    vi.mocked(userRepo.findById).mockResolvedValue(mockUser);

    const getCurrentUser = createGetCurrentUserUseCase(userRepo);
    const result = await getCurrentUser("user-123");

    expect(result.ok).toBe(true);
    if (result.ok) {
      // User型にはproviderId等は含まれない
      expect("providerId" in result.value).toBe(false);
      expect("provider" in result.value).toBe(false);
      expect("createdAt" in result.value).toBe(false);
      expect("updatedAt" in result.value).toBe(false);
    }
  });
});
