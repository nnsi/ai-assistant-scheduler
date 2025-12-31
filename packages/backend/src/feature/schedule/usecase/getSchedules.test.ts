import { describe, it, expect, vi } from "vitest";
import { createGetSchedulesUseCase } from "./getSchedules";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import type { Schedule } from "../../../domain/model/schedule";

describe("getSchedulesUseCase", () => {
  const mockSchedules: Schedule[] = [
    {
      id: "1",
      title: "予定1",
      startAt: "2025-01-10T12:00:00+09:00",
      endAt: null,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
    {
      id: "2",
      title: "予定2",
      startAt: "2025-01-15T12:00:00+09:00",
      endAt: null,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
  ];

  const createMockRepo = (): ScheduleRepo => ({
    findAll: vi.fn().mockResolvedValue(mockSchedules),
    findByMonth: vi.fn().mockResolvedValue(mockSchedules),
    findById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  });

  it("should return all schedules when no filters provided", async () => {
    const mockRepo = createMockRepo();
    const getSchedules = createGetSchedulesUseCase(mockRepo);

    const result = await getSchedules();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].title).toBe("予定1");
    }
    expect(mockRepo.findAll).toHaveBeenCalled();
  });

  it("should filter by month when year and month provided", async () => {
    const mockRepo = createMockRepo();
    const getSchedules = createGetSchedulesUseCase(mockRepo);

    const result = await getSchedules(2025, 1);

    expect(result.ok).toBe(true);
    expect(mockRepo.findByMonth).toHaveBeenCalledWith(2025, 1);
  });
});
