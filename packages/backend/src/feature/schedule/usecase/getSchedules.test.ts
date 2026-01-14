import { describe, expect, it, vi } from "vitest";
import type { CalendarRepo } from "../../../domain/infra/calendarRepo";
import type { ScheduleRepo } from "../../../domain/infra/scheduleRepo";
import type { CalendarEntity } from "../../../domain/model/calendar";
import type { ScheduleEntity } from "../../../domain/model/schedule";
import { createGetSchedulesUseCase } from "./getSchedules";

describe("getSchedulesUseCase", () => {
  const testUserId = "test-user-id";
  const testCalendarId = "test-calendar-id";

  const mockCalendars: CalendarEntity[] = [
    {
      id: testCalendarId,
      ownerId: testUserId,
      name: "テストカレンダー",
      color: "#3B82F6",
      deletedAt: null,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
  ];

  const mockSchedules: ScheduleEntity[] = [
    {
      id: "1",
      userId: testUserId,
      calendarId: testCalendarId,
      createdBy: null,
      title: "予定1",
      startAt: "2025-01-10T12:00:00+09:00",
      endAt: null,
      isAllDay: false,
      categoryId: null,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
    {
      id: "2",
      userId: testUserId,
      calendarId: testCalendarId,
      createdBy: null,
      title: "予定2",
      startAt: "2025-01-15T12:00:00+09:00",
      endAt: null,
      isAllDay: false,
      categoryId: null,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    },
  ];

  const createMockRepo = (): ScheduleRepo => ({
    findAllByUserId: vi.fn().mockResolvedValue(mockSchedules),
    findByMonthAndUserId: vi.fn().mockResolvedValue(mockSchedules),
    findByCalendarIdsOrUserId: vi.fn().mockResolvedValue(mockSchedules),
    findByMonthAndCalendarIdsOrUserId: vi.fn().mockResolvedValue(mockSchedules),
    findById: vi.fn(),
    findByIdAndUserId: vi.fn(),
    search: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  });

  const createMockCalendarRepo = (): CalendarRepo => ({
    create: vi.fn(),
    findById: vi.fn(),
    findByUserId: vi.fn().mockResolvedValue(mockCalendars),
    findDefaultByUserId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  });

  it("should return all schedules for a user when no filters provided", async () => {
    const mockRepo = createMockRepo();
    const mockCalendarRepo = createMockCalendarRepo();
    const getSchedules = createGetSchedulesUseCase(mockRepo, mockCalendarRepo);

    const result = await getSchedules(testUserId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].title).toBe("予定1");
    }
    expect(mockCalendarRepo.findByUserId).toHaveBeenCalledWith(testUserId);
    expect(mockRepo.findByCalendarIdsOrUserId).toHaveBeenCalledWith([testCalendarId], testUserId);
  });

  it("should filter by month when year and month provided", async () => {
    const mockRepo = createMockRepo();
    const mockCalendarRepo = createMockCalendarRepo();
    const getSchedules = createGetSchedulesUseCase(mockRepo, mockCalendarRepo);

    const result = await getSchedules(testUserId, 2025, 1);

    expect(result.ok).toBe(true);
    expect(mockCalendarRepo.findByUserId).toHaveBeenCalledWith(testUserId);
    expect(mockRepo.findByMonthAndCalendarIdsOrUserId).toHaveBeenCalledWith(
      2025,
      1,
      [testCalendarId],
      testUserId
    );
  });

  it("should return schedules even when user has no calendars (legacy data)", async () => {
    const mockRepo = createMockRepo();
    const mockCalendarRepo = createMockCalendarRepo();
    // biome-ignore lint/suspicious/noExplicitAny: Mock type casting
    (mockCalendarRepo.findByUserId as any).mockResolvedValue([]);
    const getSchedules = createGetSchedulesUseCase(mockRepo, mockCalendarRepo);

    const result = await getSchedules(testUserId);

    expect(result.ok).toBe(true);
    // カレンダーがなくても、calendarIdがnullのスケジュールは取得される
    expect(mockRepo.findByCalendarIdsOrUserId).toHaveBeenCalledWith([], testUserId);
  });
});
