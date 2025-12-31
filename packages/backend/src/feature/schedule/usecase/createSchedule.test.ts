import { describe, it, expect, vi } from "vitest";
import { createCreateScheduleUseCase } from "./createSchedule";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import type { SupplementRepo } from "../../../domain/infra/supplementRepo";

describe("createScheduleUseCase", () => {
  const createMockScheduleRepo = (): ScheduleRepo => ({
    findAll: vi.fn(),
    findByMonth: vi.fn(),
    findById: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
    update: vi.fn(),
    delete: vi.fn(),
  });

  const createMockSupplementRepo = (): SupplementRepo => ({
    findByScheduleId: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
    update: vi.fn(),
    delete: vi.fn(),
  });

  it("should create and save a schedule", async () => {
    const mockScheduleRepo = createMockScheduleRepo();
    const mockSupplementRepo = createMockSupplementRepo();
    const createSchedule = createCreateScheduleUseCase(mockScheduleRepo, mockSupplementRepo);

    const result = await createSchedule({
      title: "テスト予定",
      startAt: "2025-01-10T12:00:00+09:00",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.title).toBe("テスト予定");
      expect(result.value.startAt).toBe("2025-01-10T12:00:00+09:00");
      expect(result.value.id).toBeDefined();
    }
    expect(mockScheduleRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ title: "テスト予定" })
    );
  });

  it("should set endAt to null when not provided", async () => {
    const mockScheduleRepo = createMockScheduleRepo();
    const mockSupplementRepo = createMockSupplementRepo();
    const createSchedule = createCreateScheduleUseCase(mockScheduleRepo, mockSupplementRepo);

    const result = await createSchedule({
      title: "テスト予定",
      startAt: "2025-01-10T12:00:00+09:00",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.endAt).toBeNull();
    }
  });

  it("should set endAt when provided", async () => {
    const mockScheduleRepo = createMockScheduleRepo();
    const mockSupplementRepo = createMockSupplementRepo();
    const createSchedule = createCreateScheduleUseCase(mockScheduleRepo, mockSupplementRepo);

    const result = await createSchedule({
      title: "テスト予定",
      startAt: "2025-01-10T12:00:00+09:00",
      endAt: "2025-01-10T14:00:00+09:00",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.endAt).toBe("2025-01-10T14:00:00+09:00");
    }
  });
});
