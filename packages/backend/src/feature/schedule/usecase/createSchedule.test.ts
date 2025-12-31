import { describe, it, expect, vi } from "vitest";
import { createCreateScheduleUseCase } from "./createSchedule";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";

describe("createScheduleUseCase", () => {
  const createMockRepo = (): ScheduleRepo => ({
    findAll: vi.fn(),
    findByMonth: vi.fn(),
    findById: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
    update: vi.fn(),
    delete: vi.fn(),
  });

  it("should create and save a schedule", async () => {
    const mockRepo = createMockRepo();
    const createSchedule = createCreateScheduleUseCase(mockRepo);

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
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ title: "テスト予定" })
    );
  });

  it("should set endAt to null when not provided", async () => {
    const mockRepo = createMockRepo();
    const createSchedule = createCreateScheduleUseCase(mockRepo);

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
    const mockRepo = createMockRepo();
    const createSchedule = createCreateScheduleUseCase(mockRepo);

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
