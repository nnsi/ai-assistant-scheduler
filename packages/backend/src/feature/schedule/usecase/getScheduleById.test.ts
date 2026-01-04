import { describe, it, expect, vi } from "vitest";
import { createGetScheduleByIdUseCase } from "./getScheduleById";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import type { SupplementRepo } from "../../../domain/infra/supplementRepo";
import type { ScheduleEntity } from "../../../domain/model/schedule";
import type { Supplement } from "../../../domain/model/supplement";

describe("getScheduleByIdUseCase", () => {
  const testUserId = "test-user-id";

  const mockSchedule: ScheduleEntity = {
    id: "1",
    userId: testUserId,
    title: "テスト予定",
    startAt: "2025-01-10T12:00:00+09:00",
    endAt: null,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };

  const mockSupplement: Supplement = {
    id: "s1",
    scheduleId: "1",
    keywords: ["キーワード1", "キーワード2"],
    aiResult: "AI検索結果",
    shopCandidates: null,
    selectedShop: null,
    userMemo: null,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };

  const createMockRepos = () => ({
    scheduleRepo: {
      findAllByUserId: vi.fn(),
      findByMonthAndUserId: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockSchedule),
      findByIdAndUserId: vi.fn().mockResolvedValue(mockSchedule),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as ScheduleRepo,
    supplementRepo: {
      findByScheduleId: vi.fn().mockResolvedValue(mockSupplement),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as SupplementRepo,
  });

  it("should return schedule with supplement", async () => {
    const { scheduleRepo, supplementRepo } = createMockRepos();
    const getScheduleById = createGetScheduleByIdUseCase(
      scheduleRepo,
      supplementRepo
    );

    const result = await getScheduleById("1", testUserId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe("1");
      expect(result.value.title).toBe("テスト予定");
      expect(result.value.supplement).not.toBeNull();
      expect(result.value.supplement?.keywords).toEqual([
        "キーワード1",
        "キーワード2",
      ]);
    }
    expect(scheduleRepo.findByIdAndUserId).toHaveBeenCalledWith("1", testUserId);
  });

  it("should return schedule without supplement when no supplement exists", async () => {
    const { scheduleRepo, supplementRepo } = createMockRepos();
    vi.mocked(supplementRepo.findByScheduleId).mockResolvedValue(null);

    const getScheduleById = createGetScheduleByIdUseCase(
      scheduleRepo,
      supplementRepo
    );

    const result = await getScheduleById("1", testUserId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.supplement).toBeNull();
    }
  });

  it("should return error when schedule not found", async () => {
    const { scheduleRepo, supplementRepo } = createMockRepos();
    vi.mocked(scheduleRepo.findByIdAndUserId).mockResolvedValue(null);

    const getScheduleById = createGetScheduleByIdUseCase(
      scheduleRepo,
      supplementRepo
    );

    const result = await getScheduleById("nonexistent", testUserId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });
});
