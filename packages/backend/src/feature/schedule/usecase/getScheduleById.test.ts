import { describe, expect, it, vi } from "vitest";
import type { CalendarRepo } from "../../../domain/infra/calendarRepo";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import type { SupplementRepo } from "../../../domain/infra/supplementRepo";
import type { ScheduleEntity } from "../../../domain/model/schedule";
import type { Supplement } from "../../../domain/model/supplement";
import { createGetScheduleByIdUseCase } from "./getScheduleById";

describe("getScheduleByIdUseCase", () => {
  const testUserId = "test-user-id";

  const mockSchedule: ScheduleEntity = {
    id: "1",
    userId: testUserId,
    calendarId: null,
    createdBy: null,
    title: "テスト予定",
    startAt: "2025-01-10T12:00:00+09:00",
    endAt: null,
    isAllDay: false,
    categoryId: null,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };

  const mockSupplement: Supplement = {
    id: "s1",
    scheduleId: "1",
    keywords: ["キーワード1", "キーワード2"],
    agentTypes: ["search"],
    aiResult: "AI検索結果",
    shopCandidates: null,
    selectedShops: null,
    userMemo: null,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };

  const createMockRepos = () => ({
    scheduleRepo: {
      findAllByUserId: vi.fn(),
      findByMonthAndUserId: vi.fn(),
      findByCalendarIdsOrUserId: vi.fn(),
      findByMonthAndCalendarIdsOrUserId: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockSchedule),
      findByIdAndUserId: vi.fn().mockResolvedValue(mockSchedule),
      search: vi.fn(),
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
    calendarRepo: {
      findByUserId: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      findByOwnerId: vi.fn(),
      findDefaultByUserId: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as CalendarRepo,
  });

  it("should return schedule with supplement", async () => {
    const { scheduleRepo, supplementRepo, calendarRepo } = createMockRepos();
    const getScheduleById = createGetScheduleByIdUseCase(
      scheduleRepo,
      supplementRepo,
      calendarRepo
    );

    const result = await getScheduleById("1", testUserId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe("1");
      expect(result.value.title).toBe("テスト予定");
      expect(result.value.supplement).not.toBeNull();
      expect(result.value.supplement?.keywords).toEqual(["キーワード1", "キーワード2"]);
    }
    expect(scheduleRepo.findById).toHaveBeenCalledWith("1");
  });

  it("should return schedule without supplement when no supplement exists", async () => {
    const { scheduleRepo, supplementRepo, calendarRepo } = createMockRepos();
    vi.mocked(supplementRepo.findByScheduleId).mockResolvedValue(null);

    const getScheduleById = createGetScheduleByIdUseCase(
      scheduleRepo,
      supplementRepo,
      calendarRepo
    );

    const result = await getScheduleById("1", testUserId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.supplement).toBeNull();
    }
  });

  it("should return error when schedule not found", async () => {
    const { scheduleRepo, supplementRepo, calendarRepo } = createMockRepos();
    vi.mocked(scheduleRepo.findById).mockResolvedValue(null);

    const getScheduleById = createGetScheduleByIdUseCase(
      scheduleRepo,
      supplementRepo,
      calendarRepo
    );

    const result = await getScheduleById("nonexistent", testUserId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });
});
