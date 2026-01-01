import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { createUserRepo } from "./userRepo";
import { createTestDb, resetDatabase, type TestDb } from "../../test/helpers";
import type { UserEntity } from "../../domain/model/user";

describe("userRepo", () => {
  let db: TestDb;
  let userRepo: ReturnType<typeof createUserRepo>;

  const testUser: UserEntity = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    picture: "https://example.com/photo.jpg",
    googleId: "google-123",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };

  beforeAll(() => {
    db = createTestDb();
    userRepo = createUserRepo(db as any);
  });

  beforeEach(async () => {
    await resetDatabase(db);
  });

  describe("save", () => {
    it("should save a new user", async () => {
      await userRepo.save(testUser);

      const found = await userRepo.findById("user-123");
      expect(found).not.toBeNull();
      expect(found?.email).toBe("test@example.com");
      expect(found?.name).toBe("Test User");
    });
  });

  describe("findById", () => {
    it("should find user by id", async () => {
      await userRepo.save(testUser);

      const found = await userRepo.findById("user-123");
      expect(found).not.toBeNull();
      expect(found?.id).toBe("user-123");
    });

    it("should return null when user not found", async () => {
      const found = await userRepo.findById("non-existent");
      expect(found).toBeNull();
    });
  });

  describe("findByGoogleId", () => {
    it("should find user by googleId", async () => {
      await userRepo.save(testUser);

      const found = await userRepo.findByGoogleId("google-123");
      expect(found).not.toBeNull();
      expect(found?.googleId).toBe("google-123");
    });

    it("should return null when googleId not found", async () => {
      const found = await userRepo.findByGoogleId("non-existent");
      expect(found).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should find user by email", async () => {
      await userRepo.save(testUser);

      const found = await userRepo.findByEmail("test@example.com");
      expect(found).not.toBeNull();
      expect(found?.email).toBe("test@example.com");
    });

    it("should return null when email not found", async () => {
      const found = await userRepo.findByEmail("unknown@example.com");
      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    it("should update user", async () => {
      await userRepo.save(testUser);

      const updatedUser: UserEntity = {
        ...testUser,
        name: "Updated Name",
        picture: "https://example.com/new.jpg",
        updatedAt: "2025-01-02T00:00:00Z",
      };
      await userRepo.update(updatedUser);

      const found = await userRepo.findById("user-123");
      expect(found?.name).toBe("Updated Name");
      expect(found?.picture).toBe("https://example.com/new.jpg");
    });
  });
});
