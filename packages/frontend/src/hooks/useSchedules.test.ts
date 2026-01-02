import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSchedules } from "./useSchedules";
import * as api from "@/lib/api";
import type { Schedule } from "@ai-scheduler/shared";

// api モジュールをモック
vi.mock("@/lib/api", () => ({
  fetchSchedules: vi.fn(),
  createSchedule: vi.fn(),
  updateSchedule: vi.fn(),
  deleteSchedule: vi.fn(),
}));

const mockSchedule: Schedule = {
  id: "schedule-1",
  userId: "user-1",
  title: "テスト予定",
  startAt: "2025-01-15T10:00:00",
  endAt: "2025-01-15T11:00:00",
  isAllDay: false,
  memo: null,
  createdAt: "2025-01-01T00:00:00",
  updatedAt: "2025-01-01T00:00:00",
};

describe("useSchedules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("初期化と取得", () => {
    it("マウント時にスケジュールを取得する", async () => {
      vi.mocked(api.fetchSchedules).mockResolvedValue([mockSchedule]);

      const { result } = renderHook(() => useSchedules(2025, 1));

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.fetchSchedules).toHaveBeenCalledWith(2025, 1);
      expect(result.current.schedules).toEqual([mockSchedule]);
      expect(result.current.error).toBeNull();
    });

    it("エラー時はerrorを設定する", async () => {
      const mockError = new Error("Fetch Error");
      vi.mocked(api.fetchSchedules).mockRejectedValue(mockError);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.schedules).toEqual([]);
    });

    it("year/monthが変わると再取得する", async () => {
      vi.mocked(api.fetchSchedules).mockResolvedValue([mockSchedule]);

      const { result, rerender } = renderHook(
        ({ year, month }: { year: number; month: number }) =>
          useSchedules(year, month),
        { initialProps: { year: 2025, month: 1 } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.fetchSchedules).toHaveBeenCalledWith(2025, 1);

      // 月を変更
      rerender({ year: 2025, month: 2 });

      await waitFor(() => {
        expect(api.fetchSchedules).toHaveBeenCalledWith(2025, 2);
      });
    });
  });

  describe("create", () => {
    it("新しいスケジュールを作成してリストに追加する", async () => {
      vi.mocked(api.fetchSchedules).mockResolvedValue([]);
      vi.mocked(api.createSchedule).mockResolvedValue(mockSchedule);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let createdSchedule: Schedule;
      await act(async () => {
        createdSchedule = await result.current.create({
          title: "テスト予定",
          startAt: "2025-01-15T10:00:00",
          endAt: "2025-01-15T11:00:00",
          isAllDay: false,
        });
      });

      expect(createdSchedule!).toEqual(mockSchedule);
      expect(result.current.schedules).toContainEqual(mockSchedule);
    });
  });

  describe("update", () => {
    it("スケジュールを更新してリストを更新する", async () => {
      const updatedSchedule = { ...mockSchedule, title: "更新された予定" };
      vi.mocked(api.fetchSchedules).mockResolvedValue([mockSchedule]);
      vi.mocked(api.updateSchedule).mockResolvedValue(updatedSchedule);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.schedules[0].title).toBe("テスト予定");

      await act(async () => {
        await result.current.update(mockSchedule.id, {
          title: "更新された予定",
        });
      });

      expect(result.current.schedules[0].title).toBe("更新された予定");
    });
  });

  describe("remove", () => {
    it("スケジュールを削除してリストから除外する", async () => {
      vi.mocked(api.fetchSchedules).mockResolvedValue([mockSchedule]);
      vi.mocked(api.deleteSchedule).mockResolvedValue(undefined);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.schedules).toHaveLength(1);

      await act(async () => {
        await result.current.remove(mockSchedule.id);
      });

      expect(result.current.schedules).toHaveLength(0);
    });
  });

  describe("refetch", () => {
    it("スケジュールを再取得する", async () => {
      vi.mocked(api.fetchSchedules)
        .mockResolvedValueOnce([mockSchedule])
        .mockResolvedValueOnce([
          mockSchedule,
          { ...mockSchedule, id: "schedule-2", title: "新しい予定" },
        ]);

      const { result } = renderHook(() => useSchedules());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.schedules).toHaveLength(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.schedules).toHaveLength(2);
    });
  });
});
