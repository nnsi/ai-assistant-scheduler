import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { createTestApp } from "../../test/app";
import {
  createTestDb,
  createTestSchedule,
  createTestSupplement,
  createTestUser,
  resetDatabase,
  type TestDb,
} from "../../test/helpers";

describe("Supplement API Integration Tests", () => {
  let db: TestDb;
  let app: ReturnType<typeof createTestApp>;
  const testUserId = "test-user-id";

  beforeAll(() => {
    db = createTestDb();
    app = createTestApp(db, testUserId);
  });

  beforeEach(async () => {
    await resetDatabase(db);
    await createTestUser(db, { id: testUserId });
  });

  describe("PUT /api/supplements/:scheduleId/memo", () => {
    it("should update user memo", async () => {
      const schedule = await createTestSchedule(db, testUserId, { id: "memo-1" });
      await createTestSupplement(db, schedule.id, {
        keywords: ["テスト"],
        aiResult: "AI結果",
      });

      const res = await app.request(
        `/api/supplements/${schedule.id}/memo`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userMemo: "ユーザーメモを追加" }),
        }
      );
      expect(res.status).toBe(200);

      const data = (await res.json()) as { userMemo: string };
      expect(data.userMemo).toBe("ユーザーメモを追加");
    });

    it("should update existing memo", async () => {
      const schedule = await createTestSchedule(db, testUserId, { id: "memo-2" });
      await createTestSupplement(db, schedule.id, {
        keywords: ["テスト"],
        userMemo: "元のメモ",
      });

      const res = await app.request(
        `/api/supplements/${schedule.id}/memo`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userMemo: "更新されたメモ" }),
        }
      );
      expect(res.status).toBe(200);

      const data = (await res.json()) as { userMemo: string };
      expect(data.userMemo).toBe("更新されたメモ");
    });

    it("should clear memo with empty string", async () => {
      const schedule = await createTestSchedule(db, testUserId, { id: "memo-3" });
      await createTestSupplement(db, schedule.id, {
        keywords: ["テスト"],
        userMemo: "メモあり",
      });

      const res = await app.request(
        `/api/supplements/${schedule.id}/memo`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userMemo: "" }),
        }
      );
      expect(res.status).toBe(200);

      const data = (await res.json()) as { userMemo: string };
      expect(data.userMemo).toBe("");
    });

    it("should return 404 when supplement does not exist", async () => {
      // スケジュールはあるがサプリメントがない場合
      await createTestSchedule(db, testUserId, { id: "memo-4" });

      const res = await app.request(
        "/api/supplements/memo-4/memo",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userMemo: "メモ" }),
        }
      );
      expect(res.status).toBe(404);

      const data = (await res.json()) as { code: string };
      expect(data.code).toBe("NOT_FOUND");
    });

    it("should return 404 when schedule does not exist", async () => {
      const res = await app.request(
        "/api/supplements/non-existent/memo",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userMemo: "メモ" }),
        }
      );
      expect(res.status).toBe(404);
    });
  });
});
