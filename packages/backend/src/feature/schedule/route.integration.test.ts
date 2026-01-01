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

describe("Schedule API Integration Tests", () => {
  let db: TestDb;
  let app: ReturnType<typeof createTestApp>;
  const testUserId = "test-user-id";

  beforeAll(async () => {
    db = createTestDb();
    app = createTestApp(db, testUserId);
  });

  beforeEach(async () => {
    await resetDatabase(db);
    // テストユーザーを作成
    await createTestUser(db, { id: testUserId });
  });

  describe("GET /api/schedules", () => {
    it("should return empty array when no schedules exist", async () => {
      const res = await app.request("/api/schedules");
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toEqual([]);
    });

    it("should return all schedules", async () => {
      await createTestSchedule(db, testUserId, { id: "1", title: "予定1" });
      await createTestSchedule(db, testUserId, { id: "2", title: "予定2" });

      const res = await app.request("/api/schedules");
      expect(res.status).toBe(200);

      const data = (await res.json()) as { id: string; title: string }[];
      expect(data).toHaveLength(2);
      expect(data.map((s) => s.title)).toContain("予定1");
      expect(data.map((s) => s.title)).toContain("予定2");
    });

    it("should filter schedules by year and month", async () => {
      await createTestSchedule(db, testUserId, {
        id: "1",
        title: "1月の予定",
        startAt: "2025-01-15T12:00:00+09:00",
      });
      await createTestSchedule(db, testUserId, {
        id: "2",
        title: "2月の予定",
        startAt: "2025-02-15T12:00:00+09:00",
      });

      const res = await app.request("/api/schedules?year=2025&month=1");
      expect(res.status).toBe(200);

      const data = (await res.json()) as { title: string }[];
      expect(data).toHaveLength(1);
      expect(data[0].title).toBe("1月の予定");
    });
  });

  describe("POST /api/schedules", () => {
    it("should create a new schedule", async () => {
      const res = await app.request("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "新しい予定",
          startAt: "2025-01-20T14:00:00+09:00",
        }),
      });
      expect(res.status).toBe(201);

      const data = (await res.json()) as {
        id: string;
        title: string;
        startAt: string;
      };
      expect(data.id).toBeDefined();
      expect(data.title).toBe("新しい予定");
      expect(data.startAt).toBe("2025-01-20T14:00:00+09:00");
    });

    it("should create schedule with AI results", async () => {
      const res = await app.request("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "AI付き予定",
          startAt: "2025-01-20T14:00:00+09:00",
          keywords: ["ランチ", "カフェ"],
          aiResult: "# 検索結果\n\nおすすめのカフェ...",
        }),
      });
      expect(res.status).toBe(201);

      const data = (await res.json()) as { id: string };

      // サプリメントも作成されているか確認
      const getRes = await app.request(`/api/schedules/${data.id}`);
      const schedule = (await getRes.json()) as {
        supplement: {
          keywords: string[];
          aiResult: string;
        } | null;
      };
      expect(schedule.supplement).not.toBeNull();
      expect(schedule.supplement?.keywords).toEqual(["ランチ", "カフェ"]);
      expect(schedule.supplement?.aiResult).toContain("検索結果");
    });

    it("should return 400 for invalid input (empty title)", async () => {
      const res = await app.request("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "",
          startAt: "2025-01-20T14:00:00+09:00",
        }),
      });
      expect(res.status).toBe(400);

      const data = (await res.json()) as { code: string };
      expect(data.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 for invalid date format", async () => {
      const res = await app.request("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "テスト",
          startAt: "invalid-date",
        }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/schedules/:id", () => {
    it("should return schedule with supplement", async () => {
      const schedule = await createTestSchedule(db, testUserId, { id: "test-1", title: "詳細テスト" });
      await createTestSupplement(db, schedule.id, {
        keywords: ["キーワード1"],
        aiResult: "AI結果",
        userMemo: "メモ",
      });

      const res = await app.request(`/api/schedules/${schedule.id}`);
      expect(res.status).toBe(200);

      const data = (await res.json()) as {
        id: string;
        title: string;
        supplement: {
          keywords: string[];
          aiResult: string;
          userMemo: string;
        } | null;
      };
      expect(data.id).toBe("test-1");
      expect(data.title).toBe("詳細テスト");
      expect(data.supplement).not.toBeNull();
      expect(data.supplement?.keywords).toEqual(["キーワード1"]);
      expect(data.supplement?.aiResult).toBe("AI結果");
      expect(data.supplement?.userMemo).toBe("メモ");
    });

    it("should return schedule without supplement", async () => {
      const schedule = await createTestSchedule(db, testUserId, { id: "test-2" });

      const res = await app.request(`/api/schedules/${schedule.id}`);
      expect(res.status).toBe(200);

      const data = (await res.json()) as { supplement: unknown };
      expect(data.supplement).toBeNull();
    });

    it("should return 404 for non-existent schedule", async () => {
      const res = await app.request("/api/schedules/non-existent");
      expect(res.status).toBe(404);

      const data = (await res.json()) as { code: string };
      expect(data.code).toBe("NOT_FOUND");
    });
  });

  describe("PUT /api/schedules/:id", () => {
    it("should update schedule title", async () => {
      const schedule = await createTestSchedule(db, testUserId, { id: "update-1", title: "元のタイトル" });

      const res = await app.request(`/api/schedules/${schedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "新しいタイトル" }),
      });
      expect(res.status).toBe(200);

      const data = (await res.json()) as { title: string };
      expect(data.title).toBe("新しいタイトル");
    });

    it("should update schedule startAt", async () => {
      const schedule = await createTestSchedule(db, testUserId, { id: "update-2" });

      const res = await app.request(`/api/schedules/${schedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startAt: "2025-02-01T10:00:00+09:00" }),
      });
      expect(res.status).toBe(200);

      const data = (await res.json()) as { startAt: string };
      expect(data.startAt).toBe("2025-02-01T10:00:00+09:00");
    });

    it("should return 404 for non-existent schedule", async () => {
      const res = await app.request("/api/schedules/non-existent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "テスト" }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/schedules/:id", () => {
    it("should delete schedule", async () => {
      const schedule = await createTestSchedule(db, testUserId, { id: "delete-1" });

      const res = await app.request(`/api/schedules/${schedule.id}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(204);

      // 削除されたか確認
      const getRes = await app.request(`/api/schedules/${schedule.id}`);
      expect(getRes.status).toBe(404);
    });

    it("should cascade delete supplements", async () => {
      const schedule = await createTestSchedule(db, testUserId, { id: "delete-2" });
      await createTestSupplement(db, schedule.id, { keywords: ["test"] });

      const res = await app.request(`/api/schedules/${schedule.id}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(204);
    });

    it("should return 404 for non-existent schedule", async () => {
      const res = await app.request("/api/schedules/non-existent", {
        method: "DELETE",
      });
      expect(res.status).toBe(404);
    });
  });
});
